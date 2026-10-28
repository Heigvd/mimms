#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// The scenario whose files and metadata are authoritative
const CANONICAL_SCENARIO = 'basic_scenario';

// The scenario that must mirror it, file for file. Only "visibility" may differ:
// basic_scenario is all PRIVATE, model carries the real rights.
const MIRROR_SCENARIO = 'model';

const DIRECTORY_MIME_TYPE = 'application/wfs-directory';

// Fallback when a new entry has no sibling to infer its visibility from
const DEFAULT_VISIBILITY = 'INHERITED';

// Files the OS drops in folders, never part of a game model (see .gitignore)
const IGNORED_PREFIXES = ['.DS_Store'];

/**
 * Find every <scenario>/gameModel/filesmeta.json at the repo root
 */
function findScenarios() {
  const scenarios = [];

  for (const entry of fs.readdirSync(ROOT_DIR)) {
    if (entry === 'node_modules' || entry.startsWith('.')) {
      continue;
    }

    const gameModelDir = path.join(ROOT_DIR, entry, 'gameModel');
    const metaPath = path.join(gameModelDir, 'filesmeta.json');
    if (fs.existsSync(metaPath)) {
      scenarios.push({ name: entry, metaPath, filesDir: path.join(gameModelDir, 'files') });
    }
  }

  return scenarios.sort((a, b) => (a.name < b.name ? -1 : 1));
}

/**
 * List everything under a files/ folder, keyed the way filesmeta.json keys it:
 * "/" for the folder itself, "/a/" for a directory, "/a/b.png" for a file
 */
function listDisk(filesDir) {
  const found = new Set();
  if (!fs.existsSync(filesDir)) {
    return found;
  }

  const walk = (dir, prefix) => {
    found.add(prefix);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORED_PREFIXES.some(ignored => entry.name.startsWith(ignored))) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      } else {
        found.add(`${prefix}${entry.name}`);
      }
    }
  };

  walk(filesDir, '/');
  return found;
}

function toDiskPath(filesDir, key) {
  return path.join(filesDir, ...key.split('/').filter(Boolean));
}

function isDirectoryKey(key) {
  return key.endsWith('/');
}

/**
 * "/a/b/" and "/a/b.png" both have "/a/" as parent, "/" has none
 */
function parentOf(key) {
  const trimmed = isDirectoryKey(key) ? key.slice(0, -1) : key;
  return trimmed.slice(0, trimmed.lastIndexOf('/') + 1);
}

function extensionOf(key) {
  const name = key.slice(key.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot).toLowerCase() : '';
}

/**
 * Compare one filesmeta.json against its files/ folder
 */
function checkScenario(scenario) {
  const meta = JSON.parse(fs.readFileSync(scenario.metaPath, 'utf-8'));
  const disk = listDisk(scenario.filesDir);

  const metaWithoutFile = Object.keys(meta).filter(key => !disk.has(key));
  const fileWithoutMeta = [...disk].filter(key => !(key in meta)).sort();
  const wrongMimeType = Object.keys(meta).filter(
    key => isDirectoryKey(key) !== (meta[key].mimeType === DIRECTORY_MIME_TYPE)
  );

  const problems = [];
  const summarize = (items, label) => {
    if (items.length) {
      problems.push(`${items.length} ${label}`);
    }
  };

  summarize(metaWithoutFile, 'meta entry(ies) without file');
  summarize(fileWithoutMeta, 'file(s) without meta entry');
  summarize(wrongMimeType, 'directory/file mimeType mismatch(es)');

  return { scenario, meta, disk, problems, metaWithoutFile, fileWithoutMeta, wrongMimeType };
}

function sameContent(a, b) {
  return fs.readFileSync(a).equals(fs.readFileSync(b));
}

/**
 * Everything the mirror must change to match the canonical scenario,
 * visibility aside
 */
function compareScenarios(canonical, mirror) {
  const metaOnlyInCanonical = Object.keys(canonical.meta).filter(key => !(key in mirror.meta));
  const metaOnlyInMirror = Object.keys(mirror.meta).filter(key => !(key in canonical.meta));

  const fieldDiffs = [];
  for (const key of Object.keys(canonical.meta)) {
    if (!(key in mirror.meta)) {
      continue;
    }
    const fields = new Set([...Object.keys(canonical.meta[key]), ...Object.keys(mirror.meta[key])]);
    for (const field of [...fields].sort()) {
      if (field !== 'visibility' && canonical.meta[key][field] !== mirror.meta[key][field]) {
        fieldDiffs.push({
          key,
          field,
          from: mirror.meta[key][field],
          to: canonical.meta[key][field],
        });
      }
    }
  }

  const filesOnlyInCanonical = [...canonical.disk].filter(key => !mirror.disk.has(key)).sort();
  const filesOnlyInMirror = [...mirror.disk].filter(key => !canonical.disk.has(key)).sort();
  const contentDiffs = [...canonical.disk]
    .filter(
      key =>
        !isDirectoryKey(key) &&
        mirror.disk.has(key) &&
        !sameContent(
          toDiskPath(canonical.scenario.filesDir, key),
          toDiskPath(mirror.scenario.filesDir, key)
        )
    )
    .sort();

  const problems = [];
  const summarize = (items, label) => {
    if (items.length) {
      problems.push(`${items.length} ${label}`);
    }
  };

  summarize(metaOnlyInCanonical, `meta entry(ies) only in ${canonical.scenario.name}`);
  summarize(metaOnlyInMirror, `meta entry(ies) only in ${mirror.scenario.name}`);
  summarize(fieldDiffs, 'meta field difference(s)');
  summarize(filesOnlyInCanonical, `file(s) only in ${canonical.scenario.name}`);
  summarize(filesOnlyInMirror, `file(s) only in ${mirror.scenario.name}`);
  summarize(contentDiffs, 'file(s) with different content');

  return {
    canonical,
    mirror,
    problems,
    metaOnlyInCanonical,
    metaOnlyInMirror,
    fieldDiffs,
    filesOnlyInCanonical,
    filesOnlyInMirror,
    contentDiffs,
  };
}

/**
 * Serialize filesmeta.json the way Wegas (Jackson) writes it: two space
 * indent, a space on both sides of the colon, keys sorted, no final newline.
 * Unchanged metadata round-trips byte for byte.
 */
function serializeMeta(meta) {
  const object = (entries, indent) =>
    entries.length
      ? `{\n${entries.map(entry => indent + entry).join(',\n')}\n${indent.slice(2)}}`
      : '{ }';

  const entries = Object.keys(meta)
    .sort()
    .map(key => {
      const fields = Object.keys(meta[key])
        .sort()
        .map(field => `${JSON.stringify(field)} : ${JSON.stringify(meta[key][field])}`);
      return `${JSON.stringify(key)} : ${object(fields, '    ')}`;
    });

  return object(entries, '  ');
}

function writeMeta(scenario, meta) {
  const serialized = serializeMeta(meta);
  if (serialized !== fs.readFileSync(scenario.metaPath, 'utf-8')) {
    fs.writeFileSync(scenario.metaPath, serialized, 'utf-8');
  }
}

/**
 * The visibility of a new entry cannot be derived from disk. Use the most
 * frequent one among its siblings, the convention being per folder (e.g.
 * map data INHERITED, map icons INTERNAL).
 */
function inferVisibility(meta, key) {
  const parent = parentOf(key);
  const counts = new Map();

  for (const [other, entry] of Object.entries(meta)) {
    if (other !== key && entry.visibility && parentOf(other) === parent) {
      counts.set(entry.visibility, (counts.get(entry.visibility) || 0) + 1);
    }
  }

  let best = DEFAULT_VISIBILITY;
  let bestCount = 0;
  for (const [visibility, count] of counts) {
    if (count > bestCount) {
      best = visibility;
      bestCount = count;
    }
  }

  return best;
}

/**
 * Most frequent mimeType per file extension, across every filesmeta.json.
 * Wegas picks some by content rather than extension (.geojson are zipped,
 * hence application/zip), so this is safer than a generic lookup table.
 */
function buildMimeTypesByExtension(results) {
  const counts = new Map();

  for (const { meta } of results) {
    for (const [key, entry] of Object.entries(meta)) {
      const ext = extensionOf(key);
      if (isDirectoryKey(key) || !ext || entry.mimeType === DIRECTORY_MIME_TYPE) {
        continue;
      }
      const byType = counts.get(ext) || new Map();
      byType.set(entry.mimeType, (byType.get(entry.mimeType) || 0) + 1);
      counts.set(ext, byType);
    }
  }

  const mimeTypes = new Map();
  for (const [ext, byType] of counts) {
    mimeTypes.set(ext, [...byType].sort((a, b) => b[1] - a[1])[0][0]);
  }

  return mimeTypes;
}

function guessMimeType(key, mimeTypesByExtension) {
  return isDirectoryKey(key) ? DIRECTORY_MIME_TYPE : mimeTypesByExtension.get(extensionOf(key));
}

/**
 * Make one filesmeta.json match its files/ folder: the files on disk are the
 * source of truth, entries without a file are dropped
 */
function fixScenario(result, mimeTypesByExtension) {
  const meta = JSON.parse(JSON.stringify(result.meta));
  const added = [];
  const unresolved = [];
  let retyped = 0;

  for (const key of result.metaWithoutFile) {
    delete meta[key];
  }

  for (const key of result.wrongMimeType) {
    const mimeType = guessMimeType(key, mimeTypesByExtension);
    if (mimeType) {
      meta[key].mimeType = mimeType;
      retyped++;
    } else {
      unresolved.push(`${key}   (cannot tell its mimeType)`);
    }
  }

  for (const key of result.fileWithoutMeta) {
    const mimeType = guessMimeType(key, mimeTypesByExtension);
    if (!mimeType) {
      unresolved.push(
        `${key}   (no other "${extensionOf(key) || 'extensionless'}" file to copy a mimeType from)`
      );
      continue;
    }
    meta[key] = { description: '', mimeType, note: '', visibility: undefined };
    added.push(key);
  }

  for (const key of added) {
    meta[key].visibility = inferVisibility(meta, key);
  }

  writeMeta(result.scenario, meta);

  return {
    added: added.map(key => `${key}   (${meta[key].mimeType}, ${meta[key].visibility})`),
    removed: result.metaWithoutFile,
    retyped,
    unresolved,
  };
}

/**
 * Make the mirror a copy of the canonical scenario: same files, same content,
 * same metadata. Existing visibilities are kept, new entries get one inferred
 * from their siblings.
 */
function fixMirror(comparison) {
  const { canonical, mirror } = comparison;
  const from = key => toDiskPath(canonical.scenario.filesDir, key);
  const to = key => toDiskPath(mirror.scenario.filesDir, key);

  // Deepest first, so a removed folder is already empty
  for (const key of [...comparison.filesOnlyInMirror].reverse()) {
    fs.rmSync(to(key), { recursive: true, force: true });
  }

  // Sorted, so a folder is created before its content
  for (const key of comparison.filesOnlyInCanonical) {
    if (isDirectoryKey(key)) {
      fs.mkdirSync(to(key), { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(to(key)), { recursive: true });
      fs.copyFileSync(from(key), to(key));
    }
  }

  for (const key of comparison.contentDiffs) {
    fs.copyFileSync(from(key), to(key));
  }

  const meta = {};
  const added = [];
  for (const [key, entry] of Object.entries(canonical.meta)) {
    meta[key] = {
      ...entry,
      visibility: mirror.meta[key] ? mirror.meta[key].visibility : undefined,
    };
    if (!mirror.meta[key]) {
      added.push(key);
    }
  }

  for (const key of added) {
    meta[key].visibility = inferVisibility(meta, key);
  }

  writeMeta(mirror.scenario, meta);

  return {
    added: added.map(key => `${key}   (${meta[key].visibility})`),
    removed: comparison.metaOnlyInMirror.length,
    updated: new Set(comparison.fieldDiffs.map(diff => diff.key)).size,
    copied: comparison.filesOnlyInCanonical.length + comparison.contentDiffs.length,
    deleted: comparison.filesOnlyInMirror.length,
  };
}

function makeLister(verbose) {
  return (label, items) => {
    if (!items.length) {
      return;
    }
    if (label) {
      console.log(`   ${label}`);
    }
    const shown = verbose ? items : items.slice(0, 10);
    for (const item of shown) {
      console.log(`     ${item}`);
    }
    if (shown.length < items.length) {
      console.log(`     ... and ${items.length - shown.length} more (use --verbose)`);
    }
  };
}

function reportScenario(result, verbose) {
  const { scenario, problems } = result;

  if (!problems.length) {
    console.log(
      `✅ ${scenario.name}: ${Object.keys(result.meta).length} meta entries, all match files/`
    );
    return;
  }

  console.log(`❌ ${scenario.name}: ${problems.join(', ')}`);

  const list = makeLister(verbose);
  list('in filesmeta.json but not in files/:', result.metaWithoutFile);
  list('in files/ but not in filesmeta.json:', result.fileWithoutMeta);
  list(
    `mimeType must be ${DIRECTORY_MIME_TYPE} for a directory, and only for a directory:`,
    result.wrongMimeType.map(key => `${key}   (${result.meta[key].mimeType})`)
  );
}

function reportComparison(comparison, verbose) {
  const { canonical, mirror, problems } = comparison;
  const label = `${mirror.scenario.name} vs ${canonical.scenario.name}`;

  if (!problems.length) {
    console.log(`✅ ${label}: same files, same metadata (visibility aside)`);
    return;
  }

  console.log(`❌ ${label}: ${problems.join(', ')}`);

  const list = makeLister(verbose);
  list(`meta entries only in ${canonical.scenario.name}:`, comparison.metaOnlyInCanonical);
  list(`meta entries only in ${mirror.scenario.name}:`, comparison.metaOnlyInMirror);
  list(
    `meta differences (${mirror.scenario.name} -> ${canonical.scenario.name}, visibility ignored):`,
    comparison.fieldDiffs.map(
      ({ key, field, from, to }) =>
        `${key}   ${field}: ${JSON.stringify(from)} -> ${JSON.stringify(to)}`
    )
  );
  list(`files only in ${canonical.scenario.name}:`, comparison.filesOnlyInCanonical);
  list(`files only in ${mirror.scenario.name}:`, comparison.filesOnlyInMirror);
  list('files with different content:', comparison.contentDiffs);
}

/**
 * Check every scenario against its files/ folder, then the mirror against
 * the canonical scenario
 */
function runChecks(scenarios) {
  const results = scenarios.map(checkScenario);
  const canonical = results.find(result => result.scenario.name === CANONICAL_SCENARIO);
  const mirror = results.find(result => result.scenario.name === MIRROR_SCENARIO);
  const comparison = canonical && mirror ? compareScenarios(canonical, mirror) : null;

  return { results, comparison };
}

function hasProblems({ results, comparison }) {
  return (
    results.some(result => result.problems.length) ||
    Boolean(comparison && comparison.problems.length)
  );
}

function report({ results, comparison }, verbose) {
  for (const result of results) {
    reportScenario(result, verbose);
  }
  if (comparison) {
    reportComparison(comparison, verbose);
  }
}

function checkFiles(verbose, fix) {
  console.log('🔍 Checking filesmeta.json against gameModel/files/...\n');

  const scenarios = findScenarios();
  if (!scenarios.length) {
    console.error('No <scenario>/gameModel/filesmeta.json found');
    return false;
  }
  console.log(`Game models: ${scenarios.map(s => s.name).join(', ')}`);
  console.log(`Source of truth: ${CANONICAL_SCENARIO}, mirrored by ${MIRROR_SCENARIO}\n`);

  let state;
  try {
    state = runChecks(scenarios);
  } catch (error) {
    console.error(`Error reading the game models: ${error.message}`);
    return false;
  }

  report(state, verbose);
  if (!state.comparison) {
    console.log(
      `\n⚠️  ${CANONICAL_SCENARIO} or ${MIRROR_SCENARIO} not found, skipping their comparison`
    );
  }

  if (!hasProblems(state)) {
    console.log('\n✅ All files and metadata are consistent!');
    return true;
  }

  if (!fix) {
    console.log('\nRun `yarn check-files --fix` to update the files and metadata.');
    return false;
  }

  console.log('\n🔧 Fixing...');
  const mimeTypesByExtension = buildMimeTypesByExtension(state.results);
  const unresolved = [];

  // The mirror is rebuilt from the canonical scenario below, fixing it on its own would be wasted
  for (const result of state.results) {
    if (!result.problems.length || (state.comparison && result === state.comparison.mirror)) {
      continue;
    }
    const fixed = fixScenario(result, mimeTypesByExtension);
    unresolved.push(...fixed.unresolved.map(item => `${result.scenario.name}: ${item}`));
    console.log(
      `   ${result.scenario.name}: +${fixed.added.length} -${fixed.removed.length} meta entries, ` +
        `${fixed.retyped} mimeType(s) corrected`
    );
    makeLister(verbose)('added (review their mimeType and visibility):', fixed.added);
  }

  let newMirrorEntries = [];
  if (state.comparison) {
    // Compare again, the canonical scenario may just have been fixed
    const { comparison } = runChecks(scenarios);
    if (comparison.problems.length) {
      const fixed = fixMirror(comparison);
      newMirrorEntries = fixed.added;
      console.log(
        `   ${MIRROR_SCENARIO}: ${fixed.copied} file(s) copied, ${fixed.deleted} deleted, ` +
          `+${fixed.added.length} -${fixed.removed} meta entries, ${fixed.updated} updated`
      );
    }
  }

  // Re-check fresh, so what is reported is the state of the files as they are now
  const after = runChecks(scenarios);
  const list = makeLister(true);

  if (newMirrorEntries.length) {
    console.log(
      `\n👀 New ${MIRROR_SCENARIO} entries got a visibility inferred from their siblings, review it:`
    );
    list('', newMirrorEntries);
  }

  if (!hasProblems(after) && !unresolved.length) {
    console.log(
      '\n✅ Files and metadata updated, review the diff with `git status` and `git diff`.'
    );
    return true;
  }

  console.log('\n⚠️  Files and metadata updated, but some problems need a human:');
  list('', unresolved);
  report(after, verbose);

  return false;
}

// Main execution
const cmdArgs = process.argv.slice(2);
const verbose = cmdArgs.includes('--verbose') || cmdArgs.includes('-v');
const fix = cmdArgs.includes('--fix');

const success = checkFiles(verbose, fix);

process.exit(success ? 0 : 1);
