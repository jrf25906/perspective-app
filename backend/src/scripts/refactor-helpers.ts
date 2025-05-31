#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Helper script for refactoring tasks
 */

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

interface RefactoringIssue {
  file: string;
  line: number;
  issue: string;
  suggestion: string;
}

async function findConsoleLogUsage(): Promise<RefactoringIssue[]> {
  const issues: RefactoringIssue[] = [];
  const files = await glob('src/**/*.ts', { cwd: path.join(__dirname, '..', '..') });
  
  for (const file of files) {
    const filePath = path.join(__dirname, '..', '..', file);
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('console.log') && !line.includes('logger')) {
        issues.push({
          file,
          line: index + 1,
          issue: 'Using console.log instead of logger',
          suggestion: 'Replace with logger.info() or appropriate log level'
        });
      }
      if (line.includes('console.error')) {
        issues.push({
          file,
          line: index + 1,
          issue: 'Using console.error instead of logger',
          suggestion: 'Replace with logger.error()'
        });
      }
      if (line.includes('console.warn')) {
        issues.push({
          file,
          line: index + 1,
          issue: 'Using console.warn instead of logger',
          suggestion: 'Replace with logger.warn()'
        });
      }
    });
  }
  
  return issues;
}

async function findSingletonExports(): Promise<RefactoringIssue[]> {
  const issues: RefactoringIssue[] = [];
  const serviceFiles = await glob('src/services/*.ts', { cwd: path.join(__dirname, '..', '..') });
  
  for (const file of serviceFiles) {
    const filePath = path.join(__dirname, '..', '..', file);
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('export default new')) {
        issues.push({
          file,
          line: index + 1,
          issue: 'Exporting singleton instance',
          suggestion: 'Remove singleton export and use dependency injection'
        });
      }
    });
  }
  
  return issues;
}

async function findDirectServiceImports(): Promise<RefactoringIssue[]> {
  const issues: RefactoringIssue[] = [];
  const files = await glob('src/**/*.ts', { cwd: path.join(__dirname, '..', '..') });
  
  for (const file of files) {
    // Skip service files themselves
    if (file.includes('/services/') && !file.includes('Service.test')) continue;
    
    const filePath = path.join(__dirname, '..', '..', file);
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for imports from services that use default imports
      if (line.match(/import\s+\w+\s+from\s+['"].*\/services\/\w+Service['"]/)) {
        issues.push({
          file,
          line: index + 1,
          issue: 'Importing service directly instead of using DI container',
          suggestion: 'Use dependency injection container.get() instead'
        });
      }
    });
  }
  
  return issues;
}

async function generateReport(): Promise<void> {
  console.log(`${colors.blue}=== Refactoring Report ===${colors.reset}\n`);
  
  // Find console.log usage
  console.log(`${colors.yellow}Checking for console.log usage...${colors.reset}`);
  const consoleLogIssues = await findConsoleLogUsage();
  
  if (consoleLogIssues.length > 0) {
    console.log(`${colors.red}Found ${consoleLogIssues.length} console.log usages:${colors.reset}`);
    consoleLogIssues.slice(0, 10).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.issue}`);
    });
    if (consoleLogIssues.length > 10) {
      console.log(`  ... and ${consoleLogIssues.length - 10} more`);
    }
  } else {
    console.log(`${colors.green}✓ No console.log usage found${colors.reset}`);
  }
  
  console.log();
  
  // Find singleton exports
  console.log(`${colors.yellow}Checking for singleton exports...${colors.reset}`);
  const singletonIssues = await findSingletonExports();
  
  if (singletonIssues.length > 0) {
    console.log(`${colors.red}Found ${singletonIssues.length} singleton exports:${colors.reset}`);
    singletonIssues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.issue}`);
    });
  } else {
    console.log(`${colors.green}✓ No singleton exports found${colors.reset}`);
  }
  
  console.log();
  
  // Find direct service imports
  console.log(`${colors.yellow}Checking for direct service imports...${colors.reset}`);
  const importIssues = await findDirectServiceImports();
  
  if (importIssues.length > 0) {
    console.log(`${colors.red}Found ${importIssues.length} direct service imports:${colors.reset}`);
    importIssues.slice(0, 10).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.issue}`);
    });
    if (importIssues.length > 10) {
      console.log(`  ... and ${importIssues.length - 10} more`);
    }
  } else {
    console.log(`${colors.green}✓ No direct service imports found${colors.reset}`);
  }
  
  console.log();
  
  // Summary
  const totalIssues = consoleLogIssues.length + singletonIssues.length + importIssues.length;
  if (totalIssues === 0) {
    console.log(`${colors.green}✨ All refactoring tasks completed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Total issues to address: ${totalIssues}${colors.reset}`);
    console.log('\nNext steps:');
    console.log('1. Replace console.log with logger imports');
    console.log('2. Remove singleton exports from services');
    console.log('3. Update imports to use DI container');
  }
}

// Run the report
generateReport().catch(console.error); 