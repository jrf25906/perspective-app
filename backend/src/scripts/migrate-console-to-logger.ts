import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';
import { LoggerFactory, LogContext } from '../utils/logger';

const logger = LoggerFactory.forScript('migrate-console-to-logger');

/**
 * Migration configuration
 */
interface MigrationConfig {
  dryRun: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  backupDir?: string;
}

/**
 * Migration result for a single file
 */
interface FileResult {
  filePath: string;
  changes: Change[];
  error?: Error;
}

/**
 * A single change to be made
 */
interface Change {
  line: number;
  column: number;
  original: string;
  replacement: string;
  type: 'console.log' | 'console.error' | 'console.warn' | 'console.debug';
}

/**
 * Context detection for smarter logger selection
 */
function detectContext(filePath: string): { context: LogContext; module: string } {
  const normalizedPath = filePath.toLowerCase();
  const fileName = path.basename(filePath, '.ts');
  
  if (normalizedPath.includes('/controllers/')) {
    return { context: LogContext.CONTROLLER, module: fileName };
  } else if (normalizedPath.includes('/services/')) {
    return { context: LogContext.SERVICE, module: fileName };
  } else if (normalizedPath.includes('/middleware/')) {
    return { context: LogContext.MIDDLEWARE, module: fileName };
  } else if (normalizedPath.includes('/repositories/') || normalizedPath.includes('repository')) {
    return { context: LogContext.REPOSITORY, module: fileName };
  } else if (normalizedPath.includes('/scripts/')) {
    return { context: LogContext.SCRIPT, module: fileName };
  } else if (normalizedPath.includes('/migrations/')) {
    return { context: LogContext.MIGRATION, module: fileName };
  } else if (normalizedPath.includes('/tests/') || normalizedPath.includes('.test.') || normalizedPath.includes('.spec.')) {
    return { context: LogContext.TEST, module: fileName };
  } else if (normalizedPath.includes('/routes/')) {
    return { context: LogContext.CONTROLLER, module: fileName };
  } else {
    return { context: LogContext.SERVER, module: fileName };
  }
}

/**
 * Check if file already imports logger
 */
function hasLoggerImport(sourceFile: ts.SourceFile): boolean {
  let hasImport = false;
  
  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        if (importPath.includes('utils/logger') || importPath.includes('LoggerFactory')) {
          hasImport = true;
        }
      }
    }
  });
  
  return hasImport;
}

/**
 * Generate appropriate import statement
 */
function generateImportStatement(context: LogContext, moduleName: string): string {
  const contextMethod = {
    [LogContext.CONTROLLER]: 'forController',
    [LogContext.SERVICE]: 'forService',
    [LogContext.MIDDLEWARE]: 'forMiddleware',
    [LogContext.REPOSITORY]: 'forRepository',
    [LogContext.SCRIPT]: 'forScript',
    [LogContext.MIGRATION]: 'forMigration',
    [LogContext.TEST]: 'forTest',
  }[context] || 'create';
  
  if (contextMethod === 'create') {
    return `import { LoggerFactory, LogContext } from '../utils/logger';\n\nconst logger = LoggerFactory.create(LogContext.${context}, '${moduleName}');`;
  } else {
    return `import { LoggerFactory } from '../utils/logger';\n\nconst logger = LoggerFactory.${contextMethod}('${moduleName}');`;
  }
}

/**
 * Process a TypeScript source file
 */
function processFile(filePath: string, content: string): FileResult {
  const changes: Change[] = [];
  const { context, module } = detectContext(filePath);
  
  // Parse the file
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  // Visit all nodes in the AST
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      
      if (ts.isPropertyAccessExpression(expression)) {
        const object = expression.expression;
        const property = expression.name;
        
        if (ts.isIdentifier(object) && object.text === 'console') {
          const methodName = property.text;
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          
          if (['log', 'error', 'warn', 'debug'].includes(methodName)) {
            const args = node.arguments;
            let replacement = '';
            
            // Map console methods to logger methods
            const loggerMethod = {
              'log': 'info',
              'error': 'error',
              'warn': 'warn',
              'debug': 'debug'
            }[methodName] || 'info';
            
            // Handle different argument patterns
            if (args.length === 0) {
              replacement = `logger.${loggerMethod}('')`;
            } else if (args.length === 1) {
              const arg = args[0];
              const argText = content.substring(arg.getStart(), arg.getEnd());
              replacement = `logger.${loggerMethod}(${argText})`;
            } else {
              // Multiple arguments - try to be smart about it
              const firstArg = args[0];
              const firstArgText = content.substring(firstArg.getStart(), firstArg.getEnd());
              
              // Check if first argument is a string literal
              if (ts.isStringLiteral(firstArg) || ts.isTemplateExpression(firstArg)) {
                // Combine other arguments into metadata
                const restArgs = Array.from(args).slice(1);
                const metadataArgs = restArgs.map((arg, index) => {
                  const argText = content.substring(arg.getStart(), arg.getEnd());
                  return `arg${index + 1}: ${argText}`;
                }).join(', ');
                
                replacement = `logger.${loggerMethod}(${firstArgText}, { ${metadataArgs} })`;
              } else {
                // Non-string first argument, convert all to metadata
                const allArgs = Array.from(args).map((arg, index) => {
                  const argText = content.substring(arg.getStart(), arg.getEnd());
                  return `arg${index + 1}: ${argText}`;
                }).join(', ');
                
                replacement = `logger.${loggerMethod}('Log output', { ${allArgs} })`;
              }
            }
            
            changes.push({
              line: line + 1,
              column: character + 1,
              original: content.substring(node.getStart(), node.getEnd()),
              replacement,
              type: `console.${methodName}` as any
            });
          }
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  return { filePath, changes };
}

/**
 * Apply changes to file content
 */
function applyChanges(content: string, changes: Change[], needsImport: boolean, importStatement: string): string {
  // Sort changes by position (reverse order to maintain positions)
  const sortedChanges = [...changes].sort((a, b) => {
    if (a.line === b.line) {
      return b.column - a.column;
    }
    return b.line - a.line;
  });
  
  // Apply changes line by line
  const lines = content.split('\n');
  
  for (const change of sortedChanges) {
    const lineIndex = change.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const before = line.substring(0, line.indexOf(change.original));
      const after = line.substring(line.indexOf(change.original) + change.original.length);
      lines[lineIndex] = before + change.replacement + after;
    }
  }
  
  // Add import if needed
  if (needsImport && changes.length > 0) {
    // Find the right place to insert import (after other imports or at the top)
    let importIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        importIndex = i + 1;
      } else if (importIndex > 0 && !lines[i].trim()) {
        // Found empty line after imports
        break;
      }
    }
    
    lines.splice(importIndex, 0, importStatement, '');
  }
  
  return lines.join('\n');
}

/**
 * Main migration function
 */
async function migrate(config: MigrationConfig): Promise<void> {
  const startTime = logger.startTimer('Console to Logger Migration');
  
  logger.info('Starting console to logger migration', {
    dryRun: config.dryRun,
    includePatterns: config.includePatterns,
    excludePatterns: config.excludePatterns
  });
  
  // Find all TypeScript files
  const files = await glob(config.includePatterns, {
    ignore: config.excludePatterns,
    absolute: true
  });
  
  logger.info(`Found ${files.length} files to process`);
  
  const results: FileResult[] = [];
  let totalChanges = 0;
  let filesWithChanges = 0;
  let errors = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = processFile(filePath, content);
      
      if (result.changes.length > 0) {
        results.push(result);
        totalChanges += result.changes.length;
        filesWithChanges++;
        
        logger.info(`Found ${result.changes.length} console statements in ${filePath}`);
        
        if (!config.dryRun) {
          // Check if file needs import
          const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
          const needsImport = !hasLoggerImport(sourceFile);
          const { context, module } = detectContext(filePath);
          const importStatement = generateImportStatement(context, module);
          
          // Apply changes
          const newContent = applyChanges(content, result.changes, needsImport, importStatement);
          
          // Backup original if requested
          if (config.backupDir) {
            const backupPath = path.join(config.backupDir, path.relative(process.cwd(), filePath));
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
            fs.writeFileSync(backupPath, content);
          }
          
          // Write new content
          fs.writeFileSync(filePath, newContent);
          logger.info(`Updated ${filePath}`);
        }
      }
    } catch (error) {
      logger.error(`Error processing ${filePath}`, error as Error);
      errors++;
    }
  }
  
  // Print summary
  logger.info('Migration Summary', {
    filesProcessed: files.length,
    filesWithChanges,
    totalChanges,
    errors,
    mode: config.dryRun ? 'DRY RUN' : 'APPLIED'
  });
  
  if (config.dryRun && filesWithChanges > 0) {
    logger.info('Detailed changes by file:');
    results.forEach(result => {
      logger.info(`\n${result.filePath}:`);
      result.changes.forEach(change => {
        logger.info(`  Line ${change.line}: ${change.type} → logger.${change.type.replace('console.', '')}`);
        logger.debug(`    Original: ${change.original}`);
        logger.debug(`    Replacement: ${change.replacement}`);
      });
    });
  }
  
  startTime();
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const backup = args.includes('--backup') || args.includes('-b');
  
  const config: MigrationConfig = {
    dryRun,
    includePatterns: [
      'src/**/*.ts',
      '!src/**/*.test.ts',
      '!src/**/*.spec.ts'
    ],
    excludePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'src/scripts/migrate-console-to-logger.ts' // Don't migrate this file!
    ],
    backupDir: backup ? `backups/migration-${Date.now()}` : undefined
  };
  
  if (dryRun) {
    logger.info('Running in DRY RUN mode - no files will be modified');
  }
  
  await migrate(config);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Migration failed', error as Error);
    process.exit(1);
  });
}

export { migrate, MigrationConfig }; 