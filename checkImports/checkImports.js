#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'gameModel', 'pages');
const CLIENT_SCRIPT_DIR = path.join(__dirname, '..', 'gameModel', 'libs', 'ClientScript');

const errors = [];
const importsByFile = new Map();
const uniqueImports = new Map(); // Track unique imports and their usage count

/**
 * Extract all import statements from a JSON string
 * Matches patterns like: import { ... } from './path/to/module'
 */
function extractImports(content) {
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolve an import path relative to ClientScript
 * Returns the potential file paths to check
 */
function resolveImportPath(importPath) {
  const resolved = path.join(CLIENT_SCRIPT_DIR, importPath);
  const potentialPaths = [
    resolved + '.ts',
    resolved + '.js',
    resolved + '/index.ts',
    resolved + '/index.js',
  ];

  return potentialPaths;
}

/**
 * Check if an import path is valid and return the actual resolved path
 */
function getValidImportPath(importPath) {
  const potentialPaths = resolveImportPath(importPath);

  for (const filePath of potentialPaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

/**
 * Recursively read all JSON files from a directory
 */
function getAllJsonFiles(dir) {
  let jsonFiles = [];

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      jsonFiles = jsonFiles.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      jsonFiles.push(filePath);
    }
  }

  return jsonFiles;
}

/**
 * Extract all string values from a JSON object recursively
 */
function getAllStrings(obj) {
  let strings = [];

  if (typeof obj === 'string') {
    strings.push(obj);
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        strings = strings.concat(getAllStrings(item));
      }
    } else {
      for (const key in obj) {
        strings = strings.concat(getAllStrings(obj[key]));
      }
    }
  }

  return strings;
}

/**
 * Main function to check all imports
 */
function checkImports(verbose = false) {
  console.log('🔍 Checking imports in JSON configuration files...\n');

  const jsonFiles = getAllJsonFiles(PAGES_DIR);
  console.log(`Found ${jsonFiles.length} JSON files\n`);

  let totalImportsFound = 0;

  for (const jsonFile of jsonFiles) {
    try {
      const content = fs.readFileSync(jsonFile, 'utf-8');
      const jsonData = JSON.parse(content);
      const allStrings = getAllStrings(jsonData);

      const importsInFile = new Set();

      for (const str of allStrings) {
        const imports = extractImports(str);

        if (imports.length > 0) {
          for (const importPath of imports) {
            totalImportsFound++;
            importsInFile.add(importPath);

            // Track unique imports
            if (!uniqueImports.has(importPath)) {
              uniqueImports.set(importPath, {
                count: 0,
                resolvedPath: null,
                valid: false,
              });
            }
            uniqueImports.get(importPath).count++;

            const resolvedPath = getValidImportPath(importPath);
            const isValid = resolvedPath !== null;

            if (!isValid) {
              errors.push({
                file: jsonFile,
                lineContent: str.substring(0, 100),
                importPath,
                error: `Import path not found: "${importPath}"`,
              });
            } else {
              const data = uniqueImports.get(importPath);
              data.valid = true;
              data.resolvedPath = resolvedPath;
            }
          }
        }
      }

      if (importsInFile.size > 0) {
        importsByFile.set(jsonFile, importsInFile);
      }
    } catch (error) {
      console.error(`Error parsing ${jsonFile}:`, error.message);
    }
  }

  // Report results
  console.log(`📊 Summary:`);
  console.log(`- Total imports found: ${totalImportsFound}`);
  console.log(`- Unique imports: ${uniqueImports.size}`);
  console.log(`- Files with imports: ${importsByFile.size}`);
  console.log(`- Invalid imports: ${errors.length}\n`);

  if (verbose) {
    console.log(`📋 Unique imports (sorted by usage):\n`);
    const sortedImports = Array.from(uniqueImports.entries())
      .sort((a, b) => b[1].count - a[1].count);

    for (const [importPath, data] of sortedImports) {
      const status = data.valid ? '✅' : '❌';
      console.log(`  ${status} ${importPath} (used ${data.count} times)`);
    }
    console.log();
  }

  if (errors.length > 0) {
    console.log('❌ Invalid imports found:\n');

    for (const error of errors) {
      const relativeFile = path.relative(__dirname, error.file);
      console.log(`  📄 ${relativeFile}`);
      console.log(`     Import: "${error.importPath}"`);
      console.log(`     Error: ${error.error}`);
      console.log(`     Context: ${error.lineContent.substring(0, 80)}...\n`);
    }

    return false;
  } else {
    console.log('✅ All imports are valid!');
    return true;
  }
}

/**
 * Generate a detailed report
 */
function generateReport(outputFile = null) {
  const report = [];
  report.push('# Import Validation Report\n');
  report.push(`Generated: ${new Date().toISOString()}\n`);

  report.push(`## Summary\n`);
  report.push(`- Total imports found: ${Array.from(importsByFile.values()).reduce((sum, set) => sum + set.size, 0)}\n`);
  report.push(`- Unique imports: ${uniqueImports.size}\n`);
  report.push(`- Files with imports: ${importsByFile.size}\n`);
  report.push(`- Invalid imports: ${errors.length}\n\n`);

  report.push(`## Unique Imports\n\n`);
  const sortedImports = Array.from(uniqueImports.entries())
    .sort((a, b) => b[1].count - a[1].count);

  for (const [importPath, data] of sortedImports) {
    const status = data.valid ? '✅ Valid' : '❌ Invalid';
    report.push(`- ${importPath} (${data.count} uses) - ${status}\n`);
  }

  report.push(`\n## Files with Imports\n\n`);
  const sortedFiles = Array.from(importsByFile.entries())
    .sort((a, b) => b[1].size - a[1].size);

  for (const [file, imports] of sortedFiles) {
    const relativeFile = path.relative(__dirname, file);
    report.push(`### ${relativeFile}\n`);
    for (const imp of Array.from(imports).sort()) {
      report.push(`- ${imp}\n`);
    }
    report.push('\n');
  }

  if (errors.length > 0) {
    report.push(`\n## Invalid Imports\n\n`);
    for (const error of errors) {
      const relativeFile = path.relative(__dirname, error.file);
      report.push(`- **${relativeFile}**: \`${error.importPath}\`\n`);
    }
  }

  const reportContent = report.join('');

  if (outputFile) {
    fs.writeFileSync(outputFile, reportContent);
    console.log(`\n📝 Report saved to ${outputFile}`);
  } else {
    console.log('\n' + reportContent);
  }
}

// Main execution
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const report = args.includes('--report') || args.includes('-r');
const reportFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'import-report.md';

const success = checkImports(verbose);

if (report) {
  generateReport(reportFile);
}

process.exit(success ? 0 : 1);
