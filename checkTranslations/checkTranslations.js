#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// The scenario whose translations are authoritative
const CANONICAL_SCENARIO = 'basic_scenario';

// The scenario that must carry the same translations
const MIRROR_SCENARIO = 'model';

// Translation tables are ObjectDescriptors tagged this way, one translation per property
const LOCALIZATION_TAG = 'localization';

// Scripts and pages that look translations up by key
const SOURCES_DIR = path.join(ROOT_DIR, '_common', 'gameModel');

function gameModelPath(scenario) {
  return path.join(ROOT_DIR, scenario, 'gameModel', 'gamemodel.json');
}

/**
 * Every translation table of a game model, by descriptor name. Property
 * values are TranslatableContent serialized as strings, kept raw so the fix
 * can copy them verbatim.
 */
function loadScenario(name) {
  const filePath = gameModelPath(name);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const tables = new Map();

  const walk = items => {
    for (const item of items || []) {
      if (item.editorTag === LOCALIZATION_TAG && item['@class'] === 'ObjectDescriptor') {
        tables.set(item.name, item.properties || {});
      }
      walk(item.items);
    }
  };
  walk(JSON.parse(raw).items);

  return { name, filePath, raw, tables };
}

/**
 * Every script and page of _common, concatenated, to look translation keys up
 */
function loadSources() {
  const chunks = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (/\.(ts|js|json)$/.test(entry.name)) {
        chunks.push(fs.readFileSync(entryPath, 'utf-8'));
      }
    }
  };
  if (fs.existsSync(SOURCES_DIR)) {
    walk(SOURCES_DIR);
  }
  return chunks.join('\n');
}

/**
 * A key quoted as a string literal anywhere in the sources. Coarse (generic
 * keys may match unrelated strings), but it errs on the side of keeping.
 */
function isReferenced(sources, key) {
  return ['"', "'", '`'].some(quote => sources.includes(`${quote}${key}${quote}`));
}

/**
 * { EN: "text", FR: "texte" } out of a serialized TranslatableContent
 */
function translationsOf(value) {
  try {
    const content = JSON.parse(value);
    const texts = {};
    for (const [lang, translation] of Object.entries(content.translations || {})) {
      texts[lang] = translation.translation;
    }
    return texts;
  } catch (error) {
    return null;
  }
}

/**
 * Everything the mirror must change to carry the canonical translations,
 * table by table. Only the tables with a difference are listed.
 */
function compareScenarios(canonical, mirror, sources) {
  const tablesOnlyInCanonical = [...canonical.tables.keys()].filter(
    name => !mirror.tables.has(name)
  );
  const tablesOnlyInMirror = [...mirror.tables.keys()].filter(name => !canonical.tables.has(name));

  const tables = [];
  let matchingTables = 0;

  for (const [name, canonicalProps] of canonical.tables) {
    const mirrorProps = mirror.tables.get(name);
    if (!mirrorProps) {
      continue;
    }

    const table = { name, missing: [], extra: [], inUse: [], different: [] };

    for (const key of Object.keys(canonicalProps).sort()) {
      if (!(key in mirrorProps)) {
        table.missing.push({ key, value: canonicalProps[key] });
      } else if (canonicalProps[key] !== mirrorProps[key]) {
        table.different.push({ key, from: mirrorProps[key], to: canonicalProps[key] });
      }
    }

    for (const key of Object.keys(mirrorProps).sort()) {
      if (!(key in canonicalProps)) {
        const list = isReferenced(sources, key) ? table.inUse : table.extra;
        list.push({ key, value: mirrorProps[key] });
      }
    }

    if (
      table.missing.length ||
      table.extra.length ||
      table.inUse.length ||
      table.different.length
    ) {
      tables.push(table);
    } else {
      matchingTables++;
    }
  }

  const count = field => tables.reduce((sum, table) => sum + table[field].length, 0);
  const totals = {
    missing: count('missing'),
    extra: count('extra'),
    inUse: count('inUse'),
    different: count('different'),
  };

  const problems = [];
  const summarize = (n, label) => {
    if (n) {
      problems.push(`${n} ${label}`);
    }
  };

  summarize(totals.missing, `missing in ${mirror.name}`);
  summarize(totals.extra, `only in ${mirror.name}`);
  summarize(totals.inUse, `only in ${mirror.name} but used in code`);
  summarize(totals.different, 'different');
  summarize(tablesOnlyInCanonical.length, `table(s) only in ${canonical.name}`);
  summarize(tablesOnlyInMirror.length, `table(s) only in ${mirror.name}`);

  return {
    canonical,
    mirror,
    problems,
    tables,
    matchingTables,
    tablesOnlyInCanonical,
    tablesOnlyInMirror,
    // A table whose only difference is keys still used in code needs no rewrite
    tablesToFix: tables
      .filter(table => table.missing.length || table.extra.length || table.different.length)
      .map(table => table.name),
  };
}

/**
 * Locate the "properties" object of a descriptor in the raw file text: from
 * its opening brace to its closing one, and the indentation of its key
 */
function findPropertiesBlock(raw, name) {
  const pattern = new RegExp(
    `"name" : ${escapeRegExp(JSON.stringify(name))},\\n( *)"properties" : \\{`,
    'g'
  );
  const matches = [...raw.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`expected one "${name}" descriptor, found ${matches.length}`);
  }

  const [match, indent] = matches[0];
  const start = matches[0].index + match.length - 1;

  if (raw.startsWith('{ }', start)) {
    return { start, end: start + 3, indent };
  }

  const closing = `\n${indent}}`;
  const close = raw.indexOf(closing, start);
  if (close === -1) {
    throw new Error(`could not locate the end of "${name}" properties`);
  }
  return { start, end: close + closing.length, indent };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Serialize a "properties" object the way Wegas (Jackson) writes it: keys
 * sorted, a space on both sides of the colon, values as escaped strings
 */
function serializeProperties(properties, indent) {
  const keys = Object.keys(properties).sort();
  if (!keys.length) {
    return '{ }';
  }
  const entries = keys.map(
    key => `${indent}  ${JSON.stringify(key)} : ${JSON.stringify(properties[key])}`
  );
  return `{\n${entries.join(',\n')}\n${indent}}`;
}

/**
 * Give each mirror table the canonical translations, keeping the mirror only
 * ones still used in code. Done in the raw text, leaving every other byte of
 * the file untouched: a full parse and re-serialize would reformat the whole
 * export and bury the change in noise.
 */
function fixMirror(comparison, sources) {
  const { canonical, mirror } = comparison;
  let raw = mirror.raw;

  for (const name of comparison.tablesToFix) {
    const properties = { ...canonical.tables.get(name) };
    for (const [key, value] of Object.entries(mirror.tables.get(name))) {
      if (!(key in properties) && isReferenced(sources, key)) {
        properties[key] = value;
      }
    }

    const block = findPropertiesBlock(raw, name);
    raw =
      raw.slice(0, block.start) +
      serializeProperties(properties, block.indent) +
      raw.slice(block.end);
  }

  // Never write a file Wegas could not read back
  JSON.parse(raw);
  fs.writeFileSync(mirror.filePath, raw, 'utf-8');

  return comparison.tablesToFix.length;
}

// Only colour a terminal, piped output stays plain text
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = code => text => useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
const bold = paint(1);
const dim = paint(2);
const red = paint(31);
const green = paint(32);

// Without --verbose, longer texts are cut and each section shows that many keys
const MAX_TEXT_LENGTH = 90;
const MAX_KEYS = 10;

function shorten(text, verbose) {
  if (typeof text !== 'string') {
    return dim(String(text));
  }
  const oneLine = text.replace(/\s*\n\s*/g, ' ⏎ ');
  return verbose || oneLine.length <= MAX_TEXT_LENGTH
    ? oneLine
    : `${oneLine.slice(0, MAX_TEXT_LENGTH - 1)}…`;
}

function plural(n, word) {
  return `${n} ${word}${n > 1 ? 's' : ''}`;
}

/**
 * One line per language of a translation, or its raw value if unparsable
 */
function printTexts(value, colorize, verbose) {
  const texts = translationsOf(value);
  if (!texts) {
    console.log(`         ${colorize(shorten(value, verbose))}`);
    return;
  }
  for (const lang of Object.keys(texts).sort()) {
    console.log(`         ${dim(lang)}  ${colorize(shorten(texts[lang], verbose))}`);
  }
}

/**
 * The languages whose text differs, the mirror one above the canonical one
 */
function printDifference({ from, to }, mirrorName, canonicalName, verbose) {
  const fromTexts = translationsOf(from);
  const toTexts = translationsOf(to);
  if (!fromTexts || !toTexts) {
    console.log(`         ${red(shorten(from, verbose))}`);
    console.log(`         ${green(shorten(to, verbose))}`);
    return;
  }

  const width = Math.max(mirrorName.length, canonicalName.length);
  const langs = [...new Set([...Object.keys(toTexts), ...Object.keys(fromTexts)])].sort();
  const changed = langs.filter(lang => fromTexts[lang] !== toTexts[lang]);

  if (!changed.length) {
    console.log(`         ${dim('same texts, only their status or version differ')}`);
    return;
  }

  for (const lang of changed) {
    const indent = ' '.repeat(lang.length);
    console.log(
      `         ${dim(lang)}  ${dim(mirrorName.padEnd(width))}  ${red(
        shorten(fromTexts[lang], verbose)
      )}`
    );
    console.log(
      `         ${indent}  ${dim(canonicalName.padEnd(width))}  ${green(
        shorten(toTexts[lang], verbose)
      )}`
    );
  }
}

function printSection(title, entries, printEntry, verbose) {
  if (!entries.length) {
    return;
  }
  console.log(`\n   ${title}`);
  const shown = verbose ? entries : entries.slice(0, MAX_KEYS);
  for (const entry of shown) {
    console.log(`      ${bold(entry.key)}`);
    printEntry(entry);
  }
  if (shown.length < entries.length) {
    console.log(dim(`      ... and ${entries.length - shown.length} more (use --verbose)`));
  }
}

function printTable(table, comparison, verbose) {
  const mirrorName = comparison.mirror.name;
  const canonicalName = comparison.canonical.name;

  const counts = [];
  if (table.missing.length) counts.push(`${table.missing.length} missing`);
  if (table.extra.length) counts.push(`${table.extra.length} only in ${mirrorName}`);
  if (table.inUse.length)
    counts.push(`${table.inUse.length} only in ${mirrorName} but used in code`);
  if (table.different.length) counts.push(`${table.different.length} different`);

  console.log(`\n❌ ${bold(table.name)}   ${dim(counts.join(', '))}`);

  printSection(
    `➕ Missing in ${mirrorName}, added by --fix`,
    table.missing,
    entry => printTexts(entry.value, green, verbose),
    verbose
  );
  printSection(
    `➖ Only in ${mirrorName}, removed by --fix`,
    table.extra,
    entry => printTexts(entry.value, red, verbose),
    verbose
  );
  printSection(
    `⚠️  Only in ${mirrorName} but used in code, kept by --fix: add it back to ${canonicalName} in Wegas`,
    table.inUse,
    entry => printTexts(entry.value, text => text, verbose),
    verbose
  );
  printSection(
    `✏️  Different, ${mirrorName}'s text replaced by ${canonicalName}'s with --fix`,
    table.different,
    entry => printDifference(entry, mirrorName, canonicalName, verbose),
    verbose
  );
}

function report(comparison, verbose) {
  const { canonical, mirror, problems, tables, matchingTables } = comparison;

  if (!problems.length) {
    console.log(`✅ ${plural(matchingTables, 'translation table')}, all the same in both`);
    return;
  }

  for (const table of tables) {
    printTable(table, comparison, verbose);
  }

  const printTableNames = (title, names) => {
    if (names.length) {
      console.log(`\n❌ ${title}`);
      for (const name of names) {
        console.log(`      ${bold(name)}`);
      }
    }
  };
  printTableNames(
    `Tables only in ${canonical.name}: create them in ${mirror.name} in Wegas (not fixed)`,
    comparison.tablesOnlyInCanonical
  );
  printTableNames(
    `Tables only in ${mirror.name}: delete them in Wegas, or create them in ${canonical.name} (not fixed)`,
    comparison.tablesOnlyInMirror
  );

  if (matchingTables) {
    console.log(`\n✅ ${plural(matchingTables, 'other table')} all the same in both`);
  }

  console.log(`\n${bold('Summary:')} ${problems.join(', ')}`);
}

function runChecks(sources) {
  return compareScenarios(loadScenario(CANONICAL_SCENARIO), loadScenario(MIRROR_SCENARIO), sources);
}

function checkTranslations(verbose, fix) {
  console.log(
    `🔍 Comparing the translations of ${MIRROR_SCENARIO} with ${CANONICAL_SCENARIO} (source of truth)`
  );

  let sources;
  let comparison;
  try {
    sources = loadSources();
    comparison = runChecks(sources);
  } catch (error) {
    console.error(`Error reading the game models: ${error.message}`);
    return false;
  }

  report(comparison, verbose);

  if (!comparison.problems.length) {
    console.log('\n✅ All translations are consistent!');
    return true;
  }

  if (!fix) {
    if (comparison.tablesToFix.length) {
      console.log('\nRun `yarn check-translations --fix` to copy the translations to the model.');
    }
    return false;
  }

  if (comparison.tablesToFix.length) {
    console.log('\n🔧 Fixing...');
    try {
      const fixed = fixMirror(comparison, sources);
      console.log(`   ${MIRROR_SCENARIO}: ${fixed} translation table(s) updated`);
    } catch (error) {
      console.error(`Error fixing ${MIRROR_SCENARIO}: ${error.message}`);
      return false;
    }
  }

  // Re-check fresh, so what is reported is the state of the files as they are now
  const after = runChecks(sources);
  if (!after.problems.length) {
    console.log('\n✅ Translations updated, review the diff with `git diff`.');
    return true;
  }

  console.log('\n⚠️  Translations updated, but some problems need a human:');
  report(after, verbose);
  return false;
}

// Main execution
const cmdArgs = process.argv.slice(2);
const verbose = cmdArgs.includes('--verbose') || cmdArgs.includes('-v');
const fix = cmdArgs.includes('--fix');

const success = checkTranslations(verbose, fix);

process.exit(success ? 0 : 1);
