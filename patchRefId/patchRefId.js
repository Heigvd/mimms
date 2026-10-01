#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT_DIR, 'model', 'gameModel', 'gamemodel.json');
const TARGET_FILE = path.join(ROOT_DIR, 'basic_scenario', 'gameModel', 'gamemodel.json');

/**
 * Identify a named entity (variable descriptor, library, language, enum
 * item, ...) so it can be matched against its equivalent in the other
 * gamemodel.json export. Most refId-bearing objects (instances,
 * translatable contents, translations, properties, ...) have none of these
 * fields: they carry no stable identity of their own and are only matched
 * positionally, as children of an identified ancestor (see diffRefIds).
 */
function identityKey(obj) {
  const key = obj.name ?? obj.contentKey ?? obj.code;
  return key == null ? null : `${obj['@class'] || ''}::${key}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Walk two equivalent branches of a model/basic_scenario gamemodel.json pair
 * in lockstep, collecting every pair of objects whose refId differs.
 *
 * - Arrays (items, allowedValues, libraries, languages) are paired element
 *   by element using identityKey(); an element with no stable identity is
 *   reported as unmatched rather than guessed at.
 * - Plain objects are paired key by key. This is how nested, unnamed
 *   objects (defaultInstance, label, text, translations, properties, ...)
 *   end up matched against the right counterpart: they're compared under
 *   the same key of the same already-matched parent. `translations` in
 *   particular is a plain {lang: Translation} map, so this falls out for
 *   free without special-casing it.
 */
function diffRefIds(src, tgt, pathLabel, mismatches, unmatched) {
  if (Array.isArray(src) && Array.isArray(tgt)) {
    const tgtByKey = new Map();
    for (const t of tgt) {
      if (!isPlainObject(t)) continue;
      const id = identityKey(t);
      if (id != null) tgtByKey.set(id, t);
    }

    const matchedIds = new Set();
    for (const s of src) {
      if (!isPlainObject(s)) continue;
      const id = identityKey(s);
      if (id == null) continue; // no stable identity: can't reliably match, leave untouched

      const t = tgtByKey.get(id);
      if (t) {
        matchedIds.add(id);
        diffRefIds(s, t, `${pathLabel}[${id}]`, mismatches, unmatched);
      } else {
        unmatched.push({ side: 'model only', path: `${pathLabel}[${id}]` });
      }
    }
    for (const [id] of tgtByKey) {
      if (!matchedIds.has(id)) unmatched.push({ side: 'basic_scenario only', path: `${pathLabel}[${id}]` });
    }
    return;
  }

  if (isPlainObject(src) && isPlainObject(tgt)) {
    if (typeof src.refId === 'string' && typeof tgt.refId === 'string' && src.refId !== tgt.refId) {
      mismatches.push({ path: pathLabel, class: tgt['@class'], oldRefId: tgt.refId, newRefId: src.refId });
    }
    for (const k of Object.keys(src)) {
      if (k === 'refId' || !(k in tgt)) continue;
      diffRefIds(src[k], tgt[k], `${pathLabel}.${k}`, mismatches, unmatched);
    }
  }
}

/**
 * Rewrite the exact `"refId" : "<old>"` occurrences found by diffRefIds in
 * the raw file text, leaving everything else byte-for-byte untouched -
 * JSON.stringify-ing the parsed object back out would reformat the whole
 * file (quoting, spacing, array layout) and bury the real change in noise.
 * Safe because refId values are unique within a gamemodel.json export.
 */
function applyFix(rawText, mismatches) {
  let patchedText = rawText;
  let patchedCount = 0;

  for (const m of mismatches) {
    const needle = `"refId" : "${m.oldRefId}"`;
    const occurrences = patchedText.split(needle).length - 1;
    if (occurrences !== 1) {
      console.error(`Skipping ${m.path}: expected exactly one occurrence of ${needle}, found ${occurrences}`);
      continue;
    }
    patchedText = patchedText.replace(needle, `"refId" : "${m.newRefId}"`);
    patchedCount++;
  }

  return { patchedText, patchedCount };
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const verbose = args.includes('--verbose') || args.includes('-v');

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const targetRaw = fs.readFileSync(TARGET_FILE, 'utf-8');
  const target = JSON.parse(targetRaw);

  const mismatches = [];
  const unmatched = [];
  diffRefIds(model, target, 'root', mismatches, unmatched);

  if (mismatches.length === 0) {
    console.log('basic_scenario/gameModel/gamemodel.json: all refIds already match model/gameModel.');
  } else {
    console.log(`basic_scenario/gameModel/gamemodel.json: ${mismatches.length} refId mismatch(es) found`);
    for (const m of mismatches) {
      console.log(`  [${m.class}] ${m.path}`);
      console.log(`    basic_scenario: ${m.oldRefId}`);
      console.log(`    model:          ${m.newRefId}`);
    }
  }

  if (verbose && unmatched.length > 0) {
    console.log(`\n${unmatched.length} object(s) have no stable identity to match on (left untouched):`);
    for (const u of unmatched) console.log(`  [${u.side}] ${u.path}`);
  }

  if (!fix) {
    if (mismatches.length > 0) {
      console.log('\nRun with --fix to patch basic_scenario/gameModel/gamemodel.json.');
      process.exit(1);
    }
    process.exit(0);
  }

  const { patchedText, patchedCount } = applyFix(targetRaw, mismatches);
  fs.writeFileSync(TARGET_FILE, patchedText, 'utf-8');
  console.log(`\nPatched ${patchedCount}/${mismatches.length} refId(s) in basic_scenario/gameModel/gamemodel.json.`);
  process.exit(patchedCount === mismatches.length ? 0 : 1);
}

main();
