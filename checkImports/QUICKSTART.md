# Quick Start - Import Validation

## What This Does

Scans all JSON files in `gameModel/pages/` and validates that every `import` statement references a valid module in `gameModel/libs/ClientScript/`.

## Run It

```bash
# Quick validation
yarn check-imports

# See detailed import list with usage counts
yarn check-imports:verbose

# Generate a markdown report
yarn check-imports:report
```

## How It Works

1. **Reads** all JSON files from `gameModel/pages/`
2. **Extracts** import statements from string values using regex
3. **Validates** each import path exists in `gameModel/libs/ClientScript/`
4. **Reports** any invalid imports with context

## What Gets Checked

✅ ES6 import statements like:
- `import { name } from './path/to/module'`
- `import * as alias from './path/to/module'`
- `import defaultExport from './path/to/module'`

See [README.md](README.md) for full documentation.
