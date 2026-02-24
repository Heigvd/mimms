#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let ts;
try {
  ts = require('typescript');
} catch (e) {
  console.error('TypeScript not found. Please run: npm install');
  process.exit(1);
}

const PAGES_DIR = path.join(__dirname, '..', 'gameModel', 'pages');
const CLIENT_SCRIPT_DIR = path.join(__dirname, '..', 'gameModel', 'libs', 'ClientScript');
const TYPES_DIR = path.join(__dirname, '..', 'types');

const errors = [];
const scriptsByFile = new Map();
let scriptCount = 0;
let errorCount = 0;

/**
 * Create a TypeScript compiler host with proper module resolution
 */
function createCompilerHost() {
  const fileCache = new Map();

  return {
    getSourceFile: (fileName, languageVersion, onError) => {
      if (fileCache.has(fileName)) {
        return fileCache.get(fileName);
      }

      let sourceFile;
      try {
        let content;

        // Try to read the file
        if (fs.existsSync(fileName)) {
          content = fs.readFileSync(fileName, 'utf-8');
        } else {
          return undefined;
        }

        sourceFile = ts.createSourceFile(fileName, content, languageVersion, true);
        fileCache.set(fileName, sourceFile);
        return sourceFile;
      } catch (e) {
        if (onError) {
          onError(e.message);
        }
        return undefined;
      }
    },
    getDefaultLibFileName: () => 'lib.d.ts',
    writeFile: () => {},
    getCurrentDirectory: () => CLIENT_SCRIPT_DIR,
    getDirectories: () => [],
    fileExists: (fileName) => {
      try {
        return fs.existsSync(fileName);
      } catch {
        return false;
      }
    },
    readFile: (fileName) => {
      try {
        return fs.readFileSync(fileName, 'utf-8');
      } catch {
        return undefined;
      }
    },
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    resolveModuleNames: (moduleNames, containingFile) => {
      return moduleNames.map((moduleName) => {
        // Handle relative imports
        if (moduleName.startsWith('.')) {
          const dir = path.dirname(containingFile);
          const possiblePaths = [
            path.join(dir, moduleName + '.ts'),
            path.join(dir, moduleName + '.js'),
            path.join(dir, moduleName, 'index.ts'),
            path.join(dir, moduleName, 'index.js'),
          ];

          for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
              return { resolvedFileName: filePath };
            }
          }
        }

        return undefined;
      });
    },
  };
}

/**
 * Extract exported symbols from a TypeScript/JavaScript file
 */
function getExportedSymbols(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const symbols = new Set();

    // Match: export const name = ...
    // Match: export function name() { ... }
    // Match: export async function name() { ... }
    // Match: export abstract class name { ... }
    // Match: export class name { ... }
    const directExportRegex = /export\s+(?:async\s+)?(?:abstract\s+)?(?:const|let|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = directExportRegex.exec(content)) !== null) {
      symbols.add(match[1]);
    }

    // Match: export { name1, name2, ... }
    const namedExportRegex = /export\s+\{([^}]+)\}/g;
    while ((match = namedExportRegex.exec(content)) !== null) {
      const exports = match[1];
      const parts = exports.split(',');
      for (const part of parts) {
        const names = part.trim().split(/\s+as\s+/);
        const exportedName = names[names.length - 1];
        if (exportedName) {
          symbols.add(exportedName.trim());
        }
      }
    }

    // Match: export default
    if (/export\s+default\s+/i.test(content)) {
      symbols.add('default');
    }

    return symbols;
  } catch (error) {
    return new Set();
  }
}

/**
 * Extract imported symbols from content
 */
function extractImportedSymbols(content) {
  const imports = [];

  // Match: import { sym1, sym2 } from './path'
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = namedImportRegex.exec(content)) !== null) {
    const symbolsStr = match[1];
    const importPath = match[2];
    const symbols = symbolsStr
      .split(',')
      .map(s => {
        const parts = s.trim().split(/\s+as\s+/);
        return parts[0].trim();
      })
      .filter(s => s);

    imports.push({ path: importPath, symbols, type: 'named' });
  }

  // Match: import * as alias from './path'
  const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = namespaceImportRegex.exec(content)) !== null) {
    imports.push({ path: match[2], symbols: ['*'], type: 'namespace' });
  }

  // Match: import defaultExport from './path'
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.push({ path: match[2], symbols: ['default'], type: 'default' });
  }

  return imports;
}

function extractScripts(obj, path = []) {
  const scripts = [];

  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        scripts.push(...extractScripts(obj[i], [...path, `[${i}]`]));
      }
    } else {
      // Check if this is a Script object
      if ((obj['@class'] === 'Script' || obj['@class'] === 'ScriptCallback' || obj['@class'] === 'ClientScript') && obj.content && typeof obj.content === 'string') {
        scripts.push({
          content: obj.content,
          language: obj.language || 'JavaScript',
          path: path,
          line: obj._lineNumber || 0, // Will be estimated from JSON parsing
        });
      }

      for (const key in obj) {
        scripts.push(...extractScripts(obj[key], [...path, key]));
      }
    }
  }

  return scripts;
}

/**
 * Try to transpile and check for errors using TypeScript compiler API
 */
function transpileScript(content, language) {
  try {
    if (language === 'TypeScript' || language === 'typescript' || language === 'JavaScript' || language === 'javascript') {
      // Create source file and check for parse errors
      const sourceFile = ts.createSourceFile(
        'script.ts',
        content,
        ts.ScriptTarget.ES2020,
        true
      );

      // Check for parse errors
      const parseErrors = sourceFile.parseDiagnostics || [];
      if (parseErrors.length > 0) {
        const errorMessages = parseErrors
          .map((diag) => {
            if (diag.messageText) {
              return typeof diag.messageText === 'string'
                ? diag.messageText
                : ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            }
            return 'Unknown parse error';
          })
          .join('\n');
        return { success: false, error: errorMessages };
      }

      // Check for unresolved imports and missing symbols
      const imports = extractImportedSymbols(content);
      const errors = [];

      for (const importData of imports) {
        const { path: importPath, symbols, type } = importData;

        // Find the resolved file path
        const possiblePaths = [
          path.join(CLIENT_SCRIPT_DIR, importPath + '.ts'),
          path.join(CLIENT_SCRIPT_DIR, importPath + '.js'),
          path.join(CLIENT_SCRIPT_DIR, importPath, 'index.ts'),
          path.join(CLIENT_SCRIPT_DIR, importPath, 'index.js'),
        ];

        let resolvedPath = null;
        for (const p of possiblePaths) {
          try {
            if (fs.existsSync(p)) {
              resolvedPath = p;
              break;
            }
          } catch {
            // ignore
          }
        }

        if (!resolvedPath) {
          errors.push(`Cannot find module: "${importPath}"`);
        } else if (type === 'named') {
          // Check if symbols are exported
          const exportedSymbols = getExportedSymbols(resolvedPath);
          const missing = symbols.filter(sym => !exportedSymbols.has(sym));

          if (missing.length > 0) {
            errors.push(
              `Module "${importPath}" does not export: ${missing.join(', ')}. Available exports: ${
                exportedSymbols.size > 0 ? Array.from(exportedSymbols).join(', ') : '(none)'
              }`
            );
          }
        }
      }

      if (errors.length > 0) {
        return { success: false, error: errors.join('\n') };
      }

      return { success: true, error: null };
    } else {
      // For JavaScript, use TypeScript parser for syntax checking
      const sourceFile = ts.createSourceFile(
        'script.js',
        content,
        ts.ScriptTarget.ES2020,
        true
      );

      const parseErrors = sourceFile.parseDiagnostics || [];
      if (parseErrors.length > 0) {
        const errorMessages = parseErrors
          .map((diag) => {
            if (diag.messageText) {
              return typeof diag.messageText === 'string'
                ? diag.messageText
                : ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            }
            return 'Unknown error';
          })
          .join('\n');
        return { success: false, error: errorMessages };
      }

      // Check for unresolved imports (but not symbol exports for JS)
      const imports = extractImportedSymbols(content);
      const errors = [];

      for (const importData of imports) {
        const { path: importPath } = importData;

        const possiblePaths = [
          path.join(CLIENT_SCRIPT_DIR, importPath + '.ts'),
          path.join(CLIENT_SCRIPT_DIR, importPath + '.js'),
          path.join(CLIENT_SCRIPT_DIR, importPath, 'index.ts'),
          path.join(CLIENT_SCRIPT_DIR, importPath, 'index.js'),
        ];

        let resolvedPath = null;
        for (const p of possiblePaths) {
          try {
            if (fs.existsSync(p)) {
              resolvedPath = p;
              break;
            }
          } catch {
            // ignore
          }
        }

        if (!resolvedPath) {
          errors.push(`Cannot find module: "${importPath}"`);
        }
      }

      if (errors.length > 0) {
        return { success: false, error: errors.join('\n') };
      }

      return { success: true, error: null };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Format script content with line numbers for readable error output
 */
function formatScriptWithLines(content, maxLines = 10) {
  const lines = content.split('\n').slice(0, maxLines);
  return lines
    .map((line, i) => `${String(i + 1).padStart(2, ' ')} │ ${line}`)
    .join('\n');
}

/**
 * Estimate line number in JSON by counting newlines up to pattern
 */
function estimateLineNumber(jsonContent, scriptContent) {
  const escaped = JSON.stringify(scriptContent);
  const index = jsonContent.indexOf(escaped);
  if (index === -1) return 0;
  return jsonContent.substring(0, index).split('\n').length;
}

/**
 * Recursively read all JSON files
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
 * Main function to check all scripts
 */
function compileScripts(verbose = false) {
  console.log('🔍 Checking page scripts from JSON configuration files...\n');

  const jsonFiles = getAllJsonFiles(PAGES_DIR);
  console.log(`Found ${jsonFiles.length} JSON files\n`);

  for (const jsonFile of jsonFiles) {
    try {
      const content = fs.readFileSync(jsonFile, 'utf-8');
      const jsonData = JSON.parse(content);
      const scripts = extractScripts(jsonData);

      if (scripts.length > 0) {
        scriptsByFile.set(jsonFile, scripts);

        for (const script of scripts) {
          scriptCount++;
          const lineNum = estimateLineNumber(content, script.content);
          const displayPath = path.relative(path.join(__dirname, '..'), jsonFile);

          if (verbose) {
            console.log(
              `  ✓ Found ${script.language} script in ${displayPath} (approx. line ${lineNum})`
            );
          }

          // Try to compile
          const result = transpileScript(script.content, script.language);

          if (!result.success) {
            errorCount++;
            errors.push({
              file: displayPath,
              lineNumber: lineNum,
              language: script.language,
              fullScript: script.content,
              error: result.error,
            });

            if (verbose) {
              console.log(`    ❌ Error: ${result.error.split('\n')[0]}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing ${jsonFile}:`, error.message);
    }
  }

  // Report results
  console.log(`📊 Summary:`);
  console.log(`   Total scripts: ${scriptCount}`);
  console.log(`   Errors found: ${errorCount}\n`);

  if (errorCount > 0) {
    console.log('❌ Scripts with errors:\n');

    for (const error of errors) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 ${error.file}:${error.lineNumber}`);
      console.log(`   Language: ${error.language}`);
      console.log(`\n📝 Code:`);
      console.log(formatScriptWithLines(error.fullScript));
      console.log(`\n❌ Error:`);
      console.log(`   ${error.error.split('\n').join('\n   ')}`);
      console.log();
    }

    return false;
  } else {
    console.log('✅ All scripts are valid!');
    return true;
  }
}

// Main execution
const cmdArgs = process.argv.slice(2);
const verbose = cmdArgs.includes('--verbose') || cmdArgs.includes('-v');

const success = compileScripts(verbose);

process.exit(success ? 0 : 1);
