# checkPageScripts

Validates embedded TypeScript/JavaScript scripts in JSON page files (gameModel/pages/*).
This code was generated using Copilot with Claude Haiku 4.5

## What it does

Extracts all scripts from `gameModel/pages/*.json` files and validates them by:

1. **Parse checking**: Detects syntax errors in TypeScript/JavaScript code
2. **Import validation**: Verifies that all imported modules exist in `gameModel/libs/ClientScript/`
3. **Export checking**: Confirms that imported symbols are actually exported from their modules

## How to run

```bash
yarn check-page-scripts

## Output

Shows errors in a readable format with:
- File path and approximate line number in JSON
- Full script code with line numbers
- Clear error message explaining the issue

Example:
```
❌ Scripts with errors:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 gameModel/pages/9.json:307
   Language: TypeScript

📝 Code:
 1 │ import { HumanTreatmentEvent } from './game/legacy/the_world';
 2 │ ...

❌ Error:
   Module "./game/legacy/the_world" does not export: HumanTreatmentEvent
```
