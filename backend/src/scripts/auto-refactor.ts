#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import logger from '../utils/logger';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

interface FileChange {
  file: string;
  changes: string[];
}

async function replaceConsoleLogsInFile(filePath: string): Promise<boolean> {
  let content = await fs.readFile(filePath, 'utf8');
  const originalContent = content;
  let hasChanges = false;
  
  // Check if logger is already imported
  const hasLoggerImport = content.includes("import logger from '../utils/logger'") ||
                         content.includes('import logger from "../utils/logger"') ||
                         content.includes("import logger from '../../utils/logger'") ||
                         content.includes('import logger from "../../utils/logger"');
  
  // Replace console.log with logger.info
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\(/g, 'logger.info(');
    hasChanges = true;
  }
  
  // Replace console.error with logger.error
  if (content.includes('console.error')) {
    content = content.replace(/console\.error\(/g, 'logger.error(');
    hasChanges = true;
  }
  
  // Replace console.warn with logger.warn
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    hasChanges = true;
  }
  
  // Add logger import if needed and changes were made
  if (hasChanges && !hasLoggerImport) {
    // Determine the correct import path based on file location
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../../src/utils/logger'));
    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    const cleanImportPath = importPath.replace(/\\/g, '/').replace(/\.ts$/, '');
    
    // Find the right place to insert the import (after other imports)
    const importMatch = content.match(/^(import[\s\S]*?(?:from\s+['"][^'"]+['"];?\s*\n)+)/m);
    if (importMatch) {
      const imports = importMatch[0];
      content = content.replace(imports, imports + `import logger from '${cleanImportPath}';\n`);
    } else {
      // No imports found, add at the beginning
      content = `import logger from '${cleanImportPath}';\n\n` + content;
    }
  }
  
  if (hasChanges) {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

async function removeSingletonExportFromFile(filePath: string): Promise<boolean> {
  let content = await fs.readFile(filePath, 'utf8');
  const originalContent = content;
  
  // Remove lines with "export default new ServiceName()"
  const regex = /^export\s+default\s+new\s+\w+\(\);\s*$/gm;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    
    // Clean up extra blank lines at the end
    content = content.replace(/\n\s*\n\s*$/, '\n');
    
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

async function updateServiceImportsInFile(filePath: string): Promise<boolean> {
  // Skip service files and DI registration files
  if (filePath.includes('/services/') || filePath.includes('/di/serviceRegistration')) {
    return false;
  }
  
  let content = await fs.readFile(filePath, 'utf8');
  const originalContent = content;
  let hasChanges = false;
  
  // Pattern to match default imports from services
  const importRegex = /import\s+(\w+)\s+from\s+['"](.*)\/services\/(\w+)Service['"]/g;
  const matches = Array.from(content.matchAll(importRegex));
  
  for (const match of matches) {
    const [fullMatch, importName, importPath, serviceName] = match;
    
    // Skip if it's importing a class/type (starts with capital letter and doesn't end with 'Service')
    if (importName[0] === importName[0].toUpperCase() && !importName.endsWith('Service')) {
      continue;
    }
    
    // Replace with DI container usage
    hasChanges = true;
    
    // Remove the import
    content = content.replace(fullMatch + ';\n', '');
    
    // Add container import if not present
    if (!content.includes('import { container, ServiceTokens }')) {
      const importMatch = content.match(/^(import[\s\S]*?(?:from\s+['"][^'"]+['"];?\s*\n)+)/m);
      if (importMatch) {
        const imports = importMatch[0];
        content = content.replace(imports, imports + `import { container, ServiceTokens } from '../di/container';\n`);
      }
    }
    
    // Replace usage (this is a simplified approach - in real code you'd need more sophisticated replacement)
    const serviceToken = serviceName.charAt(0).toUpperCase() + serviceName.slice(1) + 'Service';
    logger.info(`Note: You'll need to manually update usage of ${importName} to container.get(ServiceTokens.${serviceToken})`);
  }
  
  if (hasChanges) {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

async function performRefactoring() {
  logger.info(`${colors.blue}=== Automated Refactoring ===${colors.reset}\n`);
  
  const changes: FileChange[] = [];
  
  // Step 1: Replace console.log usage
  logger.info(`${colors.yellow}Step 1: Replacing console.log usage...${colors.reset}`);
  const tsFiles = await glob('src/**/*.ts', { cwd: path.join(__dirname, '../..') });
  
  let consoleLogFixed = 0;
  for (const file of tsFiles) {
    const filePath = path.join(__dirname, '../..', file);
    if (await replaceConsoleLogsInFile(filePath)) {
      consoleLogFixed++;
      logger.info(`  ${colors.green}✓${colors.reset} Fixed console usage in ${file}`);
    }
  }
  logger.info(`${colors.green}Fixed console usage in ${consoleLogFixed} files${colors.reset}\n`);
  
  // Step 2: Remove singleton exports
  logger.info(`${colors.yellow}Step 2: Removing singleton exports...${colors.reset}`);
  const serviceFiles = await glob('src/services/*.ts', { cwd: path.join(__dirname, '../..') });
  
  let singletonFixed = 0;
  for (const file of serviceFiles) {
    const filePath = path.join(__dirname, '../..', file);
    if (await removeSingletonExportFromFile(filePath)) {
      singletonFixed++;
      logger.info(`  ${colors.green}✓${colors.reset} Removed singleton export from ${file}`);
    }
  }
  logger.info(`${colors.green}Removed ${singletonFixed} singleton exports${colors.reset}\n`);
  
  // Step 3: Update service imports (with warnings)
  logger.info(`${colors.yellow}Step 3: Checking service imports...${colors.reset}`);
  logger.info(`${colors.red}Note: Direct import updates require manual review to ensure proper DI usage${colors.reset}`);
  
  let importIssues = 0;
  for (const file of tsFiles) {
    const filePath = path.join(__dirname, '../..', file);
    if (await updateServiceImportsInFile(filePath)) {
      importIssues++;
    }
  }
  
  if (importIssues > 0) {
    logger.info(`${colors.yellow}Found ${importIssues} files with service imports that need manual review${colors.reset}\n`);
  }
  
  // Summary
  logger.info(`${colors.blue}=== Refactoring Summary ===${colors.reset}`);
  logger.info(`${colors.green}✓ Fixed console usage in ${consoleLogFixed} files${colors.reset}`);
  logger.info(`${colors.green}✓ Removed ${singletonFixed} singleton exports${colors.reset}`);
  if (importIssues > 0) {
    logger.info(`${colors.yellow}⚠ ${importIssues} files need manual review for service imports${colors.reset}`);
  }
  
  logger.info(`\n${colors.yellow}Next steps:${colors.reset}`);
  logger.info('1. Review the changes');
  logger.info('2. Run tests to ensure nothing is broken');
  logger.info('3. Manually update service usage to use DI container where needed');
  logger.info('4. Run the refactor-helpers script again to verify');
}

// Execute the refactoring
performRefactoring().catch(console.error); 