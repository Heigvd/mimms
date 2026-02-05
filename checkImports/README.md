# Import Validation Script - Documentation

## Overview

This package includes scripts to validate that all import statements found in JSON configuration files (located in `gameModel/pages/`) reference valid modules in the `gameModel/libs/ClientScript/` directory.

## Scripts Provided

### `checkImports.js` - Node.js Import Validator

The validation script written in Node.js. It provides comprehensive import checking with detailed reporting.

**Features:**
- Extracts import statements from all JSON strings using regex
- Validates each import against the ClientScript directory structure
- Tracks unique imports and their usage frequency
- Generates detailed reports
- Exit codes: 0 (all valid), 1 (invalid imports found)

**Usage:**

```bash
# Basic check - outputs summary
node checkImports.js

# Verbose mode - shows all imports and their status
node checkImports.js --verbose
node checkImports.js -v

# Generate and save a detailed report
node checkImports.js --report
node checkImports.js --report --output my-report.md

# Both verbose and report
node checkImports.js -v --report --output detailed-report.md
```

## How It Works

### 1. Import Pattern Detection

The script uses the following regex pattern to detect imports in JSON strings:

```regex
/import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
```

This matches patterns like:
- `import { functionName } from './path/to/module'`
- `import * as alias from './path/to/module'`
- `import defaultExport from './path/to/module'`

### 2. Path Resolution

For each extracted import path (e.g., `./tools/WegasHelper`), the validator checks:
1. `{path}.ts` - TypeScript file
2. `{path}.js` - JavaScript file
3. `{path}/index.ts` - TypeScript index file
4. `{path}/index.js` - JavaScript index file

All checks are relative to the `gameModel/libs/ClientScript/` directory.

### 3. Validation Result

- **✅ Valid**: Import path resolves to an existing file
- **❌ Invalid**: Import path cannot be resolved to any existing file

## Integration

### CI/CD Pipeline

Add to your CI configuration:

```bash
node checkImports/checkImports.js
if [ $? -ne 0 ]; then
  echo "Import validation failed!"
  exit 1
fi
```

### Git Hooks

Pre-commit hook to validate imports before commits:

```bash
#!/bin/bash
# .git/hooks/pre-commit
cd "$(git rev-parse --show-toplevel)"
node checkImports/checkImports.js || exit 1
```

### Package.json Script

Add to your `package.json`:

```json
{
  "scripts": {
    "check-imports": "node checkImports/checkImports.js",
    "check-imports:verbose": "node checkImports/checkImports.js --verbose",
    "check-imports:report": "node checkImports/checkImports.js --report --output import-report.md"
  }
}
```

Then run:
```bash
npm run check-imports
npm run check-imports:verbose
npm run check-imports:report
```

## Validation Results

### Current Status

- **Total imports found**: 1,444
- **Unique imports**: 92
- **Files with imports**: 91
- **Invalid imports**: 0 ✅

### Top Used Imports

1. `./tools/translation` (203 uses)
2. `./edition/UIfacade/patientGenFacade` (60 uses)
3. `./edition/UIfacade/genericConfigFacade` (60 uses)
4. `./UIfacade/radioFacade` (56 uses)
5. `./dashboard/dashboardFacade` (49 uses)

## Troubleshooting

### Issue: "Import path not found"

**Solution**: Verify that the referenced module exists in `gameModel/libs/ClientScript/`:
- Check for typos in the import path
- Ensure the module file has the correct extension (.ts, .js)
- For folder imports, ensure there's an index file present

### Issue: Script not executing

```bash
# Ensure Node.js is installed
node --version

# Run with explicit node
node checkImports/checkImports.js
```

## Output Files

When using `--report` flag, the script generates a markdown file containing:
- Summary statistics
- Complete list of unique imports with usage counts
- Import status (valid/invalid)
- Organized by source JSON file
- Dedicated section for any invalid imports

## Technical Details

### Import Context

In the context of this codebase, imports are expected to be evaluated as if they were in a script placed in `gameModel/libs/ClientScript/`. All relative paths (`./`) are resolved relative to this directory.

### JSON String Extraction

The script recursively traverses all properties and values in each JSON file, looking for string values that contain import statements. This handles:
- Top-level string properties
- Nested objects with string properties
- Arrays of strings or objects
- Deep nesting of any structure

### Performance

- Processes ~1,400+ imports across 100+ JSON files in seconds
- Efficiently handles recursive JSON traversal
- Minimal memory footprint

## Future Enhancements

Potential improvements:
- Support for CommonJS `require()` statements
- Export validation (checking that imported symbols actually exist)
- Unused import detection
- Import optimization suggestions
- IDE integration/plugins
- VS Code extension for real-time validation

## License & Support

For questions or issues, refer to the project documentation or contact the development team.
