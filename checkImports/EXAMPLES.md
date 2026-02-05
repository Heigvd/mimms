# Import Validation - Examples & Test Cases

## How the Validator Works - Step by Step

### Example 1: Valid Import

**JSON File:** `gameModel/pages/1.json`

```json
{
  "props": {
    "script": {
      "content": "import { dropObjectInstance } from './tools/WegasHelper';\ndropObjectInstance(...);"
    }
  }
}
```

**Validation Process:**
1. Extract import statement: `import { dropObjectInstance } from './tools/WegasHelper'`
2. Extract path: `./tools/WegasHelper`
3. Check for file: `/gameModel/libs/ClientScript/tools/WegasHelper.ts` ✅ EXISTS
4. Result: **VALID** ✅

---

### Example 2: Another Valid Import with Subdirectories

**JSON File:** `gameModel/pages/10.json`

```json
{
  "props": {
    "onUpdate": {
      "content": "import { setMatrixState } from './edition/MatrixEditor';\nsetMatrixState(...);"
    }
  }
}
```

**Validation Process:**
1. Extract import: `import { setMatrixState } from './edition/MatrixEditor'`
2. Extract path: `./edition/MatrixEditor`
3. Check for file: `/gameModel/libs/ClientScript/edition/MatrixEditor.ts` ✅ EXISTS
4. Result: **VALID** ✅

---

### Example 3: Import with Namespace

**JSON File:** `gameModel/pages/2.json`

```json
{
  "content": "import * as Helper from './tools/WegasHelper';\nHelper.dropObjectInstance(...);"
}
```

**Validation Process:**
1. Regex matches: `/import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/`
2. Extract path: `./tools/WegasHelper`
3. Check files: `.ts`, `.js`, `/index.ts`, `/index.js`
4. Result: **VALID** ✅

---

### Example 4: Deep Nested Import

**JSON File:** `gameModel/pages/50.json`

```json
{
  "ui": {
    "panels": [
      {
        "scripts": {
          "onInit": {
            "content": "import { choiceTemplate } from './edition/typeDefinitions/templateDefinitions/choiceTemplate';"
          }
        }
      }
    ]
  }
}
```

**Validation Process:**
1. Recursively traverses all nested objects and arrays
2. Finds string with import statement deep in structure
3. Extracts: `./edition/typeDefinitions/templateDefinitions/choiceTemplate`
4. Finds: `/gameModel/libs/ClientScript/edition/typeDefinitions/templateDefinitions/choiceTemplate.ts`
5. Result: **VALID** ✅

---

### Example 5: Invalid Import (Hypothetical)

**JSON File:** `gameModel/pages/99.json`

```json
{
  "content": "import { helper } from './tools/NonExistentHelper';"
}
```

**Validation Process:**
1. Extract import: `import { helper } from './tools/NonExistentHelper'`
2. Check paths:
   - `/gameModel/libs/ClientScript/tools/NonExistentHelper.ts` ❌ NOT FOUND
   - `/gameModel/libs/ClientScript/tools/NonExistentHelper.js` ❌ NOT FOUND
   - `/gameModel/libs/ClientScript/tools/NonExistentHelper/index.ts` ❌ NOT FOUND
   - `/gameModel/libs/ClientScript/tools/NonExistentHelper/index.js` ❌ NOT FOUND
3. Result: **INVALID** ❌
4. Error reported: 
   ```
   📄 gameModel/pages/99.json
   Import: "./tools/NonExistentHelper"
   Error: Import path not found: "./tools/NonExistentHelper"
   ```

---

## Regex Pattern Explained

**Pattern:**
```regex
/import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
```

**Breakdown:**
- `import` - Literal word "import"
- `\s+` - One or more whitespace
- `(?:{[^}]*}|\*\s+as\s+\w+|\w+)` - Import type (matches):
  - `{...}` - Named imports: `{ name1, name2 }`
  - `* as name` - Namespace: `* as Helper`
  - `name` - Default import: `Helper`
- `\s+from\s+` - Literal "from"
- `['"]([^'"]+)['"]` - Quoted string with capture group for path
- `g` - Global flag (find all matches)

**Matches:**
```javascript
import { func } from './path'           ✅
import { f1, f2 } from './path'        ✅
import * as alias from './path'        ✅
import defaultFunc from './path'       ✅
import { /* comment */ f } from './p'  ✅
```

**Does NOT match:**
```javascript
require('./path')                       ❌ CommonJS syntax
const x = import('./path')              ❌ Dynamic import
import type { T } from './path'         ❌ Type imports (future enhancement)
```

---

## File Resolution Rules

For each import path like `./tools/WegasHelper`, the validator checks in this order:

1. **TypeScript file:** `{path}.ts`
   - `/gameModel/libs/ClientScript/tools/WegasHelper.ts`

2. **JavaScript file:** `{path}.js`
   - `/gameModel/libs/ClientScript/tools/WegasHelper.js`

3. **TypeScript index:** `{path}/index.ts`
   - `/gameModel/libs/ClientScript/tools/WegasHelper/index.ts`

4. **JavaScript index:** `{path}/index.js`
   - `/gameModel/libs/ClientScript/tools/WegasHelper/index.js`

**First match wins** - stops checking once a file is found.

---

## Real-World Statistics

**From Current Analysis:**

### Most Used Imports
| Import | Usage Count |
|--------|------------|
| `./tools/translation` | 203 |
| `./edition/UIfacade/patientGenFacade` | 60 |
| `./edition/UIfacade/genericConfigFacade` | 60 |
| `./UIfacade/radioFacade` | 56 |
| `./dashboard/dashboardFacade` | 49 |

### Import Distribution
- 92 unique imports
- 1,444 total import statements
- 91 files contain imports
- 104 total JSON files scanned
- ~13.9 imports per file (average)

### Path Structure
- `./tools/*` - 15 imports (utility functions)
- `./edition/*` - 28 imports (editor related)
- `./UIfacade/*` - 18 imports (UI facades)
- `./game/*` - 14 imports (game logic)
- `./gameMap/*` - 8 imports (map functionality)
- `./dashboard/*` - 5 imports (dashboard)
- Others - 4 imports

---

## Testing the Validator

### Test 1: Run Basic Check
```bash
npm run check-imports

🔍 Checking imports in JSON configuration files...

Found 104 JSON files

📊 Summary:
- Total imports found: 1444
- Unique imports: 92
- Files with imports: 91
- Invalid imports: 0

✅ All imports are valid!
```

### Test 2: Verbose Output
```bash
npm run check-imports:verbose

🔍 Checking imports in JSON configuration files...

Found 104 JSON files

📊 Summary:
- Total imports found: 1444
- Unique imports: 92
- Files with imports: 91
- Invalid imports: 0

📋 Unique imports (sorted by usage):

  ✅ ./tools/translation (used 203 times)
  ✅ ./edition/UIfacade/patientGenFacade (used 60 times)
  ✅ ./edition/UIfacade/genericConfigFacade (used 60 times)
  ...
```

### Test 3: Generate Report
```bash
npm run check-imports:report
# Generates import-report.md with full details
```

---

## Troubleshooting Guide

### Issue: Import showing as invalid but file exists

**Possible Causes:**
1. File is in a subdirectory without index file
   - Solution: Create `index.ts` or `index.js` in that directory

2. Typo in import path
   - Solution: Check capitalization and path spelling

3. File extension mismatch
   - Solution: Ensure file has .ts or .js extension

### Issue: Import not detected

**Possible Causes:**
1. Import uses CommonJS syntax (`require`)
   - Solution: Use ES6 import syntax

2. Import uses dynamic syntax (`import()`)
   - Solution: Dynamic imports not currently validated

3. Import statement spans multiple lines
   - Solution: May not be detected; consolidate to single line

---

## Future Enhancements

Planned features:
- [ ] Support for CommonJS `require()` statements
- [ ] Export validation (verify exported symbols exist)
- [ ] Unused import detection
- [ ] Import optimization suggestions
- [ ] Real-time validation during development
- [ ] VS Code extension integration
- [ ] Performance profiling
