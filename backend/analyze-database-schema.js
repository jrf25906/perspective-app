#!/usr/bin/env node

/**
 * Database Schema Analysis Tool
 * 
 * This script analyzes the entire codebase to find:
 * 1. All database table references in code
 * 2. All tables created in migration files
 * 3. Missing tables that are referenced but not created
 * 4. Unused tables that are created but not referenced
 * 5. Provides remediation recommendations
 */

const fs = require('fs');
const path = require('path');

class DatabaseSchemaAnalyzer {
  constructor() {
    this.tablesInCode = new Set();
    this.tablesInMigrations = new Set();
    this.codeReferences = new Map(); // table -> [files]
    this.migrationSources = new Map(); // table -> migration file
  }

  /**
   * Extract table names from database query patterns
   */
  extractTableFromQuery(line) {
    const patterns = [
      /db\('([^']+)'\)/g,
      /\.table\('([^']+)'\)/g,
      /\.from\('([^']+)'\)/g,
      /\.into\('([^']+)'\)/g,
      /createTable\('([^']+)'/g,
      /dropTable\('([^']+)'/g
    ];

    const tables = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let tableName = match[1];
        
        // Remove alias (e.g., 'users as u' -> 'users')
        tableName = tableName.split(' as ')[0].trim();
        
        // Skip special cases
        if (!tableName || tableName.includes('${') || tableName.length < 2) {
          continue;
        }
        
        tables.push(tableName);
      }
    }
    
    return tables;
  }

  /**
   * Scan TypeScript files for database table references
   */
  scanCodeFiles(directory = 'src') {
    const scanFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const tables = this.extractTableFromQuery(line);
        tables.forEach(table => {
          this.tablesInCode.add(table);
          
          if (!this.codeReferences.has(table)) {
            this.codeReferences.set(table, []);
          }
          
          this.codeReferences.get(table).push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          });
        });
      });
    };

    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          scanFile(fullPath);
        }
      }
    };

    walkDir(directory);
  }

  /**
   * Scan migration files for table creation
   */
  scanMigrationFiles(directory = 'migrations') {
    if (!fs.existsSync(directory)) return;
    
    const files = fs.readdirSync(directory)
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        const tables = this.extractTableFromQuery(line);
        tables.forEach(table => {
          this.tablesInMigrations.add(table);
          this.migrationSources.set(table, file);
        });
      });
    }
  }

  /**
   * Analyze and find discrepancies
   */
  analyze() {
    console.log('🔍 Database Schema Analysis Report');
    console.log('=====================================\n');

    // Tables referenced in code but not in migrations
    const missingTables = [...this.tablesInCode].filter(
      table => !this.tablesInMigrations.has(table)
    );

    // Tables in migrations but not referenced in code
    const unusedTables = [...this.tablesInMigrations].filter(
      table => !this.tablesInCode.has(table)
    );

    // Shared tables
    const validTables = [...this.tablesInCode].filter(
      table => this.tablesInMigrations.has(table)
    );

    console.log(`📊 Summary:`);
    console.log(`   Total tables in code: ${this.tablesInCode.size}`);
    console.log(`   Total tables in migrations: ${this.tablesInMigrations.size}`);
    console.log(`   Valid tables: ${validTables.length}`);
    console.log(`   Missing tables: ${missingTables.length}`);
    console.log(`   Unused tables: ${unusedTables.length}\n`);

    if (missingTables.length > 0) {
      console.log('❌ Missing Tables (Referenced but not created):');
      console.log('================================================');
      missingTables.forEach(table => {
        console.log(`\n📋 Table: ${table}`);
        console.log(`   References:`);
        
        if (this.codeReferences.has(table)) {
          this.codeReferences.get(table).slice(0, 5).forEach(ref => {
            console.log(`     • ${ref.file}:${ref.line} - ${ref.content}`);
          });
          
          if (this.codeReferences.get(table).length > 5) {
            console.log(`     ... and ${this.codeReferences.get(table).length - 5} more references`);
          }
        }
      });
      console.log('\n');
    }

    if (unusedTables.length > 0) {
      console.log('⚠️  Unused Tables (Created but not referenced):');
      console.log('===============================================');
      unusedTables.forEach(table => {
        console.log(`   • ${table} (created in: ${this.migrationSources.get(table)})`);
      });
      console.log('\n');
    }

    console.log('✅ Valid Tables:');
    console.log('================');
    validTables.forEach(table => {
      const refCount = this.codeReferences.get(table)?.length || 0;
      console.log(`   • ${table} (${refCount} references)`);
    });

    return {
      missingTables,
      unusedTables,
      validTables,
      totalCodeTables: this.tablesInCode.size,
      totalMigrationTables: this.tablesInMigrations.size
    };
  }

  /**
   * Generate remediation SQL
   */
  generateRemediationSQL(missingTables) {
    if (missingTables.length === 0) {
      console.log('\n🎉 No missing tables found!');
      return;
    }

    console.log('\n🛠️  Remediation SQL:');
    console.log('====================');

    const sqlStatements = [];
    
    missingTables.forEach(table => {
      // Analyze usage patterns to suggest table structure
      const references = this.codeReferences.get(table) || [];
      const columns = this.inferColumnsFromUsage(references);
      
      console.log(`\n-- Table: ${table}`);
      console.log(`CREATE TABLE IF NOT EXISTS ${table} (`);
      console.log(`    id SERIAL PRIMARY KEY,`);
      
      columns.forEach(col => {
        console.log(`    ${col.name} ${col.type}${col.constraints ? ' ' + col.constraints : ''},`);
      });
      
      console.log(`    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`);
      console.log(`    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log(`);`);
      
      // Add common indexes
      console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_created_at ON ${table}(created_at);`);
      if (columns.some(col => col.name === 'user_id')) {
        console.log(`CREATE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id);`);
      }
    });
  }

  /**
   * Infer column structure from code usage patterns
   */
  inferColumnsFromUsage(references) {
    const columns = [];
    const patterns = new Set();
    
    references.forEach(ref => {
      const line = ref.content;
      
      // Look for INSERT patterns
      if (line.includes('.insert(')) {
        // This would need more sophisticated parsing
        // For now, add common patterns
      }
      
      // Look for WHERE patterns
      const whereMatches = line.match(/\.where\('([^']+)'/g);
      if (whereMatches) {
        whereMatches.forEach(match => {
          const field = match.match(/\.where\('([^']+)'/)[1];
          patterns.add(field);
        });
      }
      
      // Look for select patterns
      const selectMatches = line.match(/\.select\('([^']+)'/g);
      if (selectMatches) {
        selectMatches.forEach(match => {
          const field = match.match(/\.select\('([^']+)'/)[1];
          if (field !== '*') {
            patterns.add(field);
          }
        });
      }
    });
    
    // Convert patterns to column definitions
    patterns.forEach(pattern => {
      if (pattern === 'user_id') {
        columns.push({
          name: 'user_id',
          type: 'INTEGER',
          constraints: 'NOT NULL REFERENCES users(id) ON DELETE CASCADE'
        });
      } else if (pattern.includes('_id')) {
        columns.push({
          name: pattern,
          type: 'INTEGER',
          constraints: 'NOT NULL'
        });
      } else if (pattern.includes('email')) {
        columns.push({
          name: pattern,
          type: 'VARCHAR(255)',
          constraints: 'NOT NULL'
        });
      } else {
        columns.push({
          name: pattern,
          type: 'TEXT',
          constraints: null
        });
      }
    });
    
    return columns;
  }

  /**
   * Run complete analysis
   */
  run() {
    console.log('🚀 Starting database schema analysis...\n');
    
    this.scanCodeFiles('src');
    this.scanCodeFiles('tests');
    this.scanMigrationFiles('migrations');
    
    const results = this.analyze();
    this.generateRemediationSQL(results.missingTables);
    
    console.log('\n📋 Recommendations:');
    console.log('====================');
    
    if (results.missingTables.length > 0) {
      console.log('1. Create missing table migrations');
      console.log('2. Update database schema');
      console.log('3. Test all affected services');
    }
    
    if (results.unusedTables.length > 0) {
      console.log('4. Review unused tables - can they be removed?');
      console.log('5. Document purpose of unused tables if they are needed');
    }
    
    console.log('\n✅ Analysis complete!');
    
    return results;
  }
}

// Run the analysis
const analyzer = new DatabaseSchemaAnalyzer();
analyzer.run(); 