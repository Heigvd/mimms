#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const LIBS_DIR = path.join(ROOT_DIR, '_common', 'gameModel', 'libs');

/**
 * The library types Wegas stores under _common/gameModel/libs/<libraryType>/.
 * A file <libraryType>/<contentKey><ext> must have a matching descriptor
 * { libraryType, contentKey } in the "libraries" array of every gamemodel.json.
 */
const LIBRARY_TYPES = {
  ClientScript: { ext: '.ts', contentType: 'application/typescript' },
  ServerScript: { ext: '.js', contentType: 'application/javascript' },
  CSS: { ext: '.css', contentType: 'text/css' },
  Theme: { ext: '.json', contentType: 'json' },
  SelectedThemes: { ext: '.json', contentType: 'json' },
};

// Fallback when a file has no descriptor anywhere to infer visibility from
const DEFAULT_VISIBILITY = 'INTERNAL';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Parse a gamemodel.json.
 *
 * Wegas exports are not always strictly valid JSON: model/ carries
 * a trailing comma inside an ObjectDescriptor properties map, which
 * makes JSON.parse throw. Strip trailing commas first, taking care to leave
 * string contents alone (descriptors embed escaped JSON, so a naive regex would
 * corrupt them).
 */
function parseGameModel(raw) {
  return JSON.parse(stripTrailingCommas(raw));
}

function stripTrailingCommas(src) {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (inString) {
      out += c;
      if (escaped) {
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }

    if (c === ',') {
      let j = i + 1;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === '}' || src[j] === ']') {
        continue; // drop the trailing comma
      }
    }

    out += c;
  }

  return out;
}

/**
 * Recursively list files under dir, as paths relative to dir with / separators
 */
function listFiles(dir, base = dir) {
  let found = [];

  for (const entry of fs.readdirSync(dir)) {
    const filePath = path.join(dir, entry);

    if (fs.statSync(filePath).isDirectory()) {
      found = found.concat(listFiles(filePath, base));
    } else {
      found.push(path.relative(base, filePath).split(path.sep).join('/'));
    }
  }

  return found;
}

/**
 * Scan _common/gameModel/libs/ and return, per library type, the set of
 * contentKeys on disk plus any file with an unexpected extension
 */
function scanLibsFolder() {
  const keysByType = {};
  const unexpectedFiles = [];

  for (const [libraryType, { ext }] of Object.entries(LIBRARY_TYPES)) {
    const typeDir = path.join(LIBS_DIR, libraryType);
    keysByType[libraryType] = new Set();

    if (!fs.existsSync(typeDir)) {
      continue;
    }

    for (const file of listFiles(typeDir)) {
      if (file.endsWith(ext)) {
        keysByType[libraryType].add(file.slice(0, -ext.length));
      } else {
        unexpectedFiles.push({ libraryType, file, ext });
      }
    }
  }

  return { keysByType, unexpectedFiles };
}

/**
 * Find every <scenario>/gameModel/gamemodel.json at the repo root
 */
function findScenarios() {
  const scenarios = [];

  for (const entry of fs.readdirSync(ROOT_DIR)) {
    if (entry === 'node_modules' || entry.startsWith('.')) {
      continue;
    }

    const gameModelPath = path.join(ROOT_DIR, entry, 'gameModel', 'gamemodel.json');
    if (fs.existsSync(gameModelPath)) {
      scenarios.push({ name: entry, filePath: gameModelPath });
    }
  }

  return scenarios.sort((a, b) => (a.name < b.name ? -1 : 1));
}

/**
 * Sort key of a descriptor: libraryType then contentKey, both case insensitive.
 * This is the order Wegas itself writes, hence ClientScript before CSS.
 */
function sortKey(descriptor) {
  return `${descriptor.libraryType}/${descriptor.contentKey}`.toLowerCase();
}

function compareDescriptors(a, b) {
  const ka = sortKey(a);
  const kb = sortKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

/**
 * The visibility of a new descriptor cannot be derived from disk, and the
 * scenarios disagree (basic_scenario is all PRIVATE, the others mostly
 * INTERNAL). Use the most frequent value for that library type in that file.
 */
function inferVisibility(libraries, libraryType) {
  const counts = new Map();

  for (const library of libraries) {
    if (library.libraryType === libraryType) {
      counts.set(library.visibility, (counts.get(library.visibility) || 0) + 1);
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
 * Build a refId for a new descriptor, in the "#<n>" not-yet-persisted form
 * Wegas uses itself. The suffix is derived from the content key so that
 * repeated runs, and different developers, produce the same output.
 */
function makeRefId(libraries, libraryType, contentKey, usedRefIds) {
  let maxHashId = 0;
  for (const library of libraries) {
    const id = String(library.refId || '').split(':')[1];
    if (id && id.startsWith('#')) {
      const n = parseInt(id.slice(1), 10);
      if (!isNaN(n) && n > maxHashId) {
        maxHashId = n;
      }
    }
  }

  const suffix = hashSuffix(`${libraryType}/${contentKey}`);

  // Only the full refId has to be unique within a file
  let n = maxHashId + 1;
  let refId = `GameModelContent:#${n}:${suffix}`;
  while (usedRefIds.has(refId)) {
    n++;
    refId = `GameModelContent:#${n}:${suffix}`;
  }

  return refId;
}

function hashSuffix(input) {
  // FNV-1a, kept deterministic across platforms and node versions
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix = BASE62[hash % 62] + suffix;
    hash = Math.floor(hash / 62);
    if (hash === 0) {
      hash = 0x811c9dc5 + i;
    }
  }

  return suffix;
}

/**
 * Pair an orphan descriptor with an orphan file when they share a basename and
 * each side has exactly one candidate: that is a moved file, so the descriptor
 * keeps its refId and visibility instead of losing its Wegas identity.
 */
function detectRenames(missingDescriptors, orphanDescriptors) {
  const basename = key => key.slice(key.lastIndexOf('/') + 1);
  const renames = [];

  for (const orphan of orphanDescriptors) {
    const candidates = missingDescriptors.filter(
      key => basename(key) === basename(orphan.contentKey)
    );
    const reverse = orphanDescriptors.filter(
      other => basename(other.contentKey) === basename(orphan.contentKey)
    );

    if (candidates.length === 1 && reverse.length === 1) {
      renames.push({ from: orphan, to: candidates[0] });
    }
  }

  return renames;
}

/**
 * Compare one gamemodel.json against the files on disk
 */
function checkScenario(scenario, keysByType) {
  const raw = fs.readFileSync(scenario.filePath, 'utf-8');
  const libraries = parseGameModel(raw).libraries || [];

  const problems = [];
  const missingDescriptors = []; // file on disk, no descriptor
  const orphanDescriptors = []; // descriptor, no file on disk
  const unknownTypes = [];
  const duplicates = [];
  const inlinedContent = [];
  const inversions = [];

  const seen = new Set();
  for (const library of libraries) {
    const key = `${library.libraryType}/${library.contentKey}`;

    if (!LIBRARY_TYPES[library.libraryType]) {
      unknownTypes.push(library);
      continue;
    }

    if (seen.has(key)) {
      duplicates.push(library);
    }
    seen.add(key);

    if (library.content !== '') {
      inlinedContent.push(library);
    }

    if (!keysByType[library.libraryType].has(library.contentKey)) {
      orphanDescriptors.push(library);
    }
  }

  for (const [libraryType, keys] of Object.entries(keysByType)) {
    for (const contentKey of keys) {
      if (!seen.has(`${libraryType}/${contentKey}`)) {
        missingDescriptors.push({ libraryType, contentKey });
      }
    }
  }

  for (let i = 1; i < libraries.length; i++) {
    if (compareDescriptors(libraries[i - 1], libraries[i]) > 0) {
      inversions.push({ previous: libraries[i - 1], current: libraries[i] });
    }
  }

  missingDescriptors.sort(compareDescriptors);

  const renames = detectRenames(
    missingDescriptors.map(d => d.contentKey),
    orphanDescriptors
  );

  const summarize = (items, label) => {
    if (items.length) {
      problems.push(`${items.length} ${label}`);
    }
  };

  summarize(missingDescriptors, 'file(s) without descriptor');
  summarize(orphanDescriptors, 'descriptor(s) without file');
  summarize(duplicates, 'duplicate descriptor(s)');
  summarize(inlinedContent, 'descriptor(s) with inlined content');
  summarize(unknownTypes, 'unknown library type(s)');
  summarize(inversions, 'sort order inversion(s)');

  return {
    scenario,
    raw,
    libraries,
    problems,
    missingDescriptors,
    orphanDescriptors,
    unknownTypes,
    duplicates,
    inlinedContent,
    inversions,
    renames,
  };
}

/**
 * Serialize the "libraries" array the way Jackson does it: two space indent,
 * a space on both sides of the colon, keys in alphabetical order
 */
function serializeLibraries(libraries) {
  const entries = libraries.map(library =>
    [
      `    "@class" : ${JSON.stringify(library['@class'])},`,
      `    "content" : ${JSON.stringify(library.content)},`,
      `    "contentKey" : ${JSON.stringify(library.contentKey)},`,
      `    "contentType" : ${JSON.stringify(library.contentType)},`,
      `    "libraryType" : ${JSON.stringify(library.libraryType)},`,
      `    "refId" : ${JSON.stringify(library.refId)},`,
      `    "version" : ${JSON.stringify(library.version === undefined ? null : library.version)},`,
      `    "visibility" : ${JSON.stringify(library.visibility)}`,
    ].join('\n')
  );

  if (!entries.length) {
    return '  "libraries" : [ ],';
  }

  return `  "libraries" : [ {\n${entries.join('\n  }, {\n')}\n  } ],`;
}

/**
 * Replace the "libraries" block in place, leaving every other byte of the file
 * untouched. A full parse and re-serialize would reformat 7500 lines and
 * silently drop the trailing comma these exports carry.
 */
function replaceLibrariesBlock(raw, libraries) {
  const startMarker = '\n  "libraries" : [';
  const start = raw.indexOf(startMarker);
  if (start === -1) {
    throw new Error('could not locate the "libraries" block');
  }

  const endMarker = '\n  } ],\n';
  const emptyMarker = '\n  "libraries" : [ ],\n';
  let end;

  if (raw.startsWith(emptyMarker, start)) {
    end = start + emptyMarker.length - 1;
  } else {
    const blockEnd = raw.indexOf(endMarker, start);
    if (blockEnd === -1) {
      throw new Error('could not locate the end of the "libraries" block');
    }
    end = blockEnd + endMarker.length - 1;
  }

  return `${raw.slice(0, start)}\n${serializeLibraries(libraries)}${raw.slice(end)}`;
}

/**
 * Rewrite one gamemodel.json so its descriptors match the files on disk.
 * Existing descriptors are kept as they are, renames keep their identity.
 */
function fixScenario(result) {
  const { libraries, missingDescriptors, orphanDescriptors, renames } = result;

  const renamedFrom = new Map(); // new contentKey -> descriptor being moved
  const renamedRefIds = new Set();
  for (const rename of renames) {
    renamedFrom.set(rename.to, rename.from);
    renamedRefIds.add(rename.from.refId);
  }

  const removed = orphanDescriptors.filter(library => !renamedRefIds.has(library.refId));
  const removedRefIds = new Set(removed.map(library => library.refId));

  // Drop duplicates as well, keeping the first occurrence
  const keptKeys = new Set();
  const kept = [];
  for (const library of libraries) {
    if (removedRefIds.has(library.refId) || renamedRefIds.has(library.refId)) {
      continue;
    }

    const key = `${library.libraryType}/${library.contentKey}`;
    if (keptKeys.has(key)) {
      removed.push(library);
      continue;
    }
    keptKeys.add(key);
    kept.push(library);
  }

  const usedRefIds = new Set(libraries.map(library => library.refId));
  const added = [];

  for (const { libraryType, contentKey } of missingDescriptors) {
    const source = renamedFrom.get(contentKey);
    const refId = source ? source.refId : makeRefId(libraries, libraryType, contentKey, usedRefIds);
    usedRefIds.add(refId);

    added.push({
      '@class': 'GameModelContent',
      content: '',
      contentKey,
      contentType: LIBRARY_TYPES[libraryType].contentType,
      libraryType,
      refId,
      version: null,
      visibility: source ? source.visibility : inferVisibility(libraries, libraryType),
    });
  }

  const fixed = kept.concat(added);
  for (const library of fixed) {
    library.content = '';
  }
  fixed.sort(compareDescriptors);

  fs.writeFileSync(result.scenario.filePath, replaceLibrariesBlock(result.raw, fixed), 'utf-8');

  return { added, removed, renames, total: fixed.length };
}

function reportScenario(result, verbose) {
  const {
    scenario,
    problems,
    missingDescriptors,
    orphanDescriptors,
    unknownTypes,
    duplicates,
    inlinedContent,
    inversions,
    renames,
  } = result;

  if (!problems.length) {
    console.log(`✅ ${scenario.name}: ${result.libraries.length} descriptors, all consistent`);
    return;
  }

  console.log(`❌ ${scenario.name}: ${problems.join(', ')}`);

  const renamedTo = new Map(renames.map(rename => [rename.to, rename.from.contentKey]));
  const renamedFromKeys = new Set(renames.map(rename => rename.from.contentKey));

  const list = (label, items) => {
    if (!items.length) {
      return;
    }
    console.log(`   ${label}`);
    const shown = verbose ? items : items.slice(0, 10);
    for (const item of shown) {
      console.log(`     ${item}`);
    }
    if (shown.length < items.length) {
      console.log(`     ... and ${items.length - shown.length} more (use --verbose)`);
    }
  };

  list(
    'on disk but no descriptor:',
    missingDescriptors.map(({ libraryType, contentKey }) => {
      const from = renamedTo.get(contentKey);
      const suffix = from ? `   (looks moved from ${from})` : '';
      return `${libraryType}/${contentKey}${suffix}`;
    })
  );
  list(
    'descriptor but no file:',
    orphanDescriptors.map(library => {
      const suffix = renamedFromKeys.has(library.contentKey) ? '   (see move above)' : '';
      return `${library.libraryType}/${library.contentKey}${suffix}`;
    })
  );
  list(
    'duplicate descriptors:',
    duplicates.map(library => `${library.libraryType}/${library.contentKey}`)
  );
  list(
    'inlined content (must be empty, the file on disk is the source):',
    inlinedContent.map(
      library => `${library.libraryType}/${library.contentKey}   (${library.content.length} chars)`
    )
  );
  list(
    'unknown library type:',
    unknownTypes.map(library => `${library.libraryType}/${library.contentKey}`)
  );
  list(
    'out of order:',
    inversions.map(
      ({ previous, current }) =>
        `${current.libraryType}/${current.contentKey}   (should not follow ${previous.contentKey})`
    )
  );
}

function checkLibraries(verbose, fix) {
  console.log('🔍 Checking gameModel libraries against _common/gameModel/libs/...\n');

  const { keysByType, unexpectedFiles } = scanLibsFolder();
  const scenarios = findScenarios();

  if (!scenarios.length) {
    console.error('No <scenario>/gameModel/gamemodel.json found');
    return false;
  }

  const counts = Object.entries(keysByType)
    .map(([libraryType, keys]) => `${libraryType} ${keys.size}`)
    .join(', ');
  console.log(`Files on disk: ${counts}`);
  console.log(`Game models: ${scenarios.map(s => s.name).join(', ')}\n`);

  const results = [];
  for (const scenario of scenarios) {
    try {
      results.push(checkScenario(scenario, keysByType));
    } catch (error) {
      console.error(`Error reading ${scenario.filePath}: ${error.message}`);
      return false;
    }
  }

  for (const result of results) {
    reportScenario(result, verbose);
  }

  if (unexpectedFiles.length) {
    console.log('\n❌ files Wegas will ignore, they cannot have a descriptor:');
    for (const { libraryType, file, ext } of unexpectedFiles) {
      console.log(`     ${libraryType}/${file}   (expected ${ext})`);
    }
  }

  const broken = results.filter(result => result.problems.length);

  console.log('\n📊 Summary:');
  console.log(`   Game models checked: ${results.length}`);
  console.log(`   Game models with problems: ${broken.length}`);

  if (!broken.length && !unexpectedFiles.length) {
    console.log('\n✅ All library descriptors match the files on disk!');
    return true;
  }

  if (!fix) {
    if (broken.length) {
      console.log('\nRun `yarn check-libraries --fix` to update the descriptors.');
    }
    return false;
  }

  console.log('\n🔧 Fixing...');
  for (const result of broken) {
    const { added, removed, renames, total } = fixScenario(result);
    console.log(
      `   ${result.scenario.name}: +${added.length - renames.length} -${removed.length}` +
        ` ~${renames.length} moved, sorted, ${total} descriptors`
    );
  }

  // Re-check, so what is reported is the state of the files as they are now
  const remaining = broken
    .map(result => checkScenario(result.scenario, keysByType))
    .filter(result => result.problems.length);

  if (!remaining.length && !unexpectedFiles.length) {
    console.log('\n✅ Descriptors updated, review the diff with `git diff`.');
    return true;
  }

  console.log('\n⚠️  Descriptors updated, but some problems need a human:');
  for (const result of remaining) {
    reportScenario(result, verbose);
  }
  if (unexpectedFiles.length) {
    console.log('   rename or remove the files listed above so Wegas stops ignoring them');
  }

  return false;
}

// Main execution
const cmdArgs = process.argv.slice(2);
const verbose = cmdArgs.includes('--verbose') || cmdArgs.includes('-v');
const fix = cmdArgs.includes('--fix');

const success = checkLibraries(verbose, fix);

process.exit(success ? 0 : 1);
