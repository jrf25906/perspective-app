import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import logger from '../utils/logger';

/**
 * Automated console.* to logger migration script
 * Uses TypeScript AST to safely replace console statements
 */

interface MigrationResult {
  filePath: string;
  replacements: number;
  errors: string[];
}

class ConsoleToLoggerMigrator {
  private results: MigrationResult[] = [];
  
  /**
   * Map console methods to logger methods
   */
  private readonly methodMap: Record<string, string> = {
    'log': 'info',
    'error': 'error',
    'warn': 'warn',
    'debug': 'debug',
    'info': 'info'
  };

  /**
   * Files to exclude from migration
   */
  private readonly excludePatterns = [
    /node_modules/,
    /dist/,
    /build/,
    /\.test\./,
    /\.spec\./,
    /migrate-console-to-logger\.ts/ // Don't migrate this file itself
  ];

  /**
   * Process a single TypeScript file
   */
  private processFile(filePath: string): MigrationResult {
    const result: MigrationResult = {
      filePath,
      replacements: 0,
      errors: []
    };

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true
      );

      let modified = false;
      let hasLoggerImport = this.hasLoggerImport(sourceFile);
      
      // Transform the AST
      const transformer = <T extends ts.Node>(context: ts.TransformationContext) => 
        (rootNode: T): T => {
          const visit = (node: ts.Node): ts.Node => {
            // Check if it's a console.* call
            if (this.isConsoleCall(node)) {
              const callExpr = node as ts.CallExpression;
              const propertyAccess = callExpr.expression as ts.PropertyAccessExpression;
              const methodName = propertyAccess.name.text;
              
              if (this.methodMap[methodName]) {
                modified = true;
                result.replacements++;
                
                // Create logger.* call
                return ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier('logger'),
                    ts.factory.createIdentifier(this.methodMap[methodName])
                  ),
                  undefined,
                  callExpr.arguments
                );
              }
            }
            
            return ts.visitEachChild(node, visit, context);
          };
          
          return ts.visitNode(rootNode, visit) as T;
        };

      // Apply transformation
      const transformResult = ts.transform(sourceFile, [transformer]);
      const transformedSource = transformResult.transformed[0];
      
      if (modified) {
        // Generate the new code
        const printer = ts.createPrinter({ 
          newLine: ts.NewLineKind.LineFeed,
          removeComments: false
        });
        
        let newContent = printer.printFile(transformedSource as ts.SourceFile);
        
        // Add logger import if not present
        if (!hasLoggerImport) {
          const importStatement = this.generateLoggerImport(filePath);
          newContent = importStatement + '\n' + newContent;
        }
        
        // Write the modified file
        fs.writeFileSync(filePath, newContent);
        logger.info(`✅ Migrated ${filePath} - ${result.replacements} replacements`);
      }
      
      transformResult.dispose();
    } catch (error) {
      result.errors.push(error.message);
      logger.error(`❌ Error processing ${filePath}:`, error);
    }
    
    return result;
  }

  /**
   * Check if node is a console.* method call
   */
  private isConsoleCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    
    const expr = node.expression;
    if (!ts.isPropertyAccessExpression(expr)) return false;
    
    const obj = expr.expression;
    return ts.isIdentifier(obj) && obj.text === 'console';
  }

  /**
   * Check if file already has logger import
   */
  private hasLoggerImport(sourceFile: ts.SourceFile): boolean {
    let hasImport = false;
    
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier) && 
            moduleSpecifier.text.includes('logger')) {
          hasImport = true;
        }
      }
    });
    
    return hasImport;
  }

  /**
   * Generate appropriate logger import based on file location
   */
  private generateLoggerImport(filePath: string): string {
    const loggerPath = path.join(__dirname, '../utils/logger');
    const fileDirPath = path.dirname(filePath);
    let relativePath = path.relative(fileDirPath, loggerPath);
    
    // Ensure proper format
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    // Remove .ts extension if present
    relativePath = relativePath.replace(/\.ts$/, '');
    
    return `import logger from '${relativePath}';`;
  }

  /**
   * Recursively find all TypeScript files
   */
  private findTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    
    const processDirectory = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        // Skip excluded patterns
        if (this.excludePatterns.some(pattern => pattern.test(fullPath))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };
    
    processDirectory(dir);
    return files;
  }

  /**
   * Run the migration
   */
  public async migrate(targetDir: string): Promise<void> {
    logger.info(`🚀 Starting console.* to logger migration in ${targetDir}`);
    
    const files = this.findTypeScriptFiles(targetDir);
    logger.info(`Found ${files.length} TypeScript files to process`);
    
    for (const file of files) {
      const result = this.processFile(file);
      this.results.push(result);
    }
    
    // Generate summary
    this.printSummary();
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    const totalReplacements = this.results.reduce((sum, r) => sum + r.replacements, 0);
    const filesModified = this.results.filter(r => r.replacements > 0).length;
    const errors = this.results.filter(r => r.errors.length > 0);
    
    logger.info('\n📊 Migration Summary:');
    logger.info(`Total files processed: ${this.results.length}`);
    logger.info(`Files modified: ${filesModified}`);
    logger.info(`Total replacements: ${totalReplacements}`);
    
    if (errors.length > 0) {
      logger.error(`\n❌ Errors encountered in ${errors.length} files:`);
      errors.forEach(result => {
        logger.error(`  ${result.filePath}:`);
        result.errors.forEach(err => logger.error(`    - ${err}`));
      });
    } else {
      logger.info('\n✅ Migration completed successfully!');
    }
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'console-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    logger.info(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
if (require.main === module) {
  const migrator = new ConsoleToLoggerMigrator();
  const targetDir = process.argv[2] || path.join(__dirname, '..');
  
  migrator.migrate(targetDir).catch(error => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });
}

export default ConsoleToLoggerMigrator; 