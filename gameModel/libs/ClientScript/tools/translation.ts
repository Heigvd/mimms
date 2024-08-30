import { ActDefinition, ItemDefinition } from '../HUMAn/pathology';
import { translationLogger } from './logger';

export type knownLanguages = 'en' | 'fr';

let cache: Record<string, SObjectDescriptor> = {};

/**
 * @param category must be an object type
 * @param key is case insensitive
 * @param uppercase first letter, defaults to true
 * @param values interpolation values corresponding to {0}, {1},... placeholders in the translation string
 */
export function getTranslation(
  category: keyof VariableClasses,
  key: string,
  upperCaseFirstLetter = true,
  values: (string | number)[] = []
): string {
  //if(!cache[category]){
  cache[category] = Variable.find(gameModel, category) as SObjectDescriptor;
  //}
  if (cache[category]) {
    //TODO cache parsed ?
    const tr = cache[category]!.getProperties()[key.toLowerCase()];
    if (tr) {
      const t = JSON.parse(tr);
      const translated = I18n.translate(t);
      if (translated) {
        const interpolated = interpolate(translated, values);
        return upperCaseFirstLetter ? upperCaseFirst(interpolated) : interpolated;
      }
    }
  }
  const fallback = '::' + category + '/' + key;
  translationLogger.info('Translation not found', fallback);
  return fallback;
}

/**
 * same as getTranslation but with rest values arguments
 * @see getTranslation
 */
export function getTranslationAlt(
  category: keyof VariableClasses,
  key: string,
  upperCaseFirstLetter = true,
  ...values: (string | number)[]
): string {
  return getTranslation(category, key, upperCaseFirstLetter, values);
}

function interpolate(template: string, values: (string | number)[]): string {
  if (!values) return template;

  let result = template;
  for (let i = 0; i < values.length; i++) {
    const placeholder = `{${i}}`;

    if (template.includes(placeholder)) {
      result = result.replaceAll(placeholder, String(values[i]));
    } else {
      translationLogger.warn(`Placeholder at index ${i} ('${values[i]}') not found in ${template}`);
    }
  }
  return result;
}

export function getTranslatedRecord(
  record: Record<string, any>,
  category: keyof VariableClasses,
  prefix: string
): Record<string, any> {
  const translated: Record<string, number> = {};
  Object.entries(record).forEach(([key, value]) => {
    translated[getTranslation(category, prefix + key)] = value;
  });
  return translated;
}

export function getTranslatedRecordAsString(
  record: Record<string, any>,
  category: keyof VariableClasses,
  prefix: string
): string {
  let result = '';
  Object.entries(getTranslatedRecord(record, category, prefix)).forEach(([key, value]) => {
    result += key + ': ' + value + '\n';
  });
  return result;
}

export function getBlockTranslation(blockName: string): string {
  return getTranslation('human-blocks', blockName);
}

export function getPathologyTranslation(pathologyName: string): string {
  return getTranslation('human-pathology', pathologyName);
}

export function getItemTranslation(item: ItemDefinition) {
  return getTranslation('human-items', item.id);
}

export function getItemActionTranslation(item: ItemDefinition, actionId: string) {
  const manyActions = Object.keys(item.actions).length > 1;
  if (manyActions) {
    return getTranslation('human-items', `${item.id}::${actionId}`);
  } else {
    return getTranslation('human-items', item.id);
  }
}

export function getActTranslation(act: ActDefinition) {
  return getTranslation('human-actions', act.id);
}

function upperCaseFirst(s: string): string {
  if (s && s.length > 0) return s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

function lowerCaseFirst(s: string): string {
  if (s && s.length > 0) return s.charAt(0).toLowerCase() + s.slice(1);
  return s;
}

/**
 * CSV to translation object
 * expected format
 * header
 * 'Key .*', EN, FR
 * line content
 * <key>, <EN>, <FR>
 */
function updateCategoryFromTsv(filename: string, category: keyof VariableClasses, dryrun: boolean) {
  Helpers.downloadFile(`translations/${filename}`, 'TEXT').then(tsv => {
    if (tsv.startsWith('<!DOCTYPE')) {
      // TODO should be empty or raise and error
      wlog('tsv file not found : ', filename);
      return;
    }
    const lines = tsv.split('\n');
    if (lines.length < 1) {
      wlog('File has no lines', filename);
    }
    const header = lines[0]!.split('\t');

    if (
      !header ||
      !header[1] ||
      header[1].trim() !== 'EN' ||
      !header[2] ||
      header[2].trim() !== 'FR'
    ) {
      throw new Error(
        filename + ' bad format, expected header : key, EN, FR, <any>. received : ' + header
      );
    }

    const statements: string[] = [`Variable.find(gameModel, "${category}").clearProperties()`];

    lines.slice(1).forEach(line => {
      const l = line.split('\t');
      if (!l || l.length < 3) {
        return;
      }
      const tr = buildTranslation(l[1]!, l[2]!);
      const key = l[0]!.trim().toLowerCase();
      const s = `Variable.find(gameModel, "${category}").setProperty(${JSON.stringify(
        key
      )}, ${JSON.stringify(JSON.stringify(tr))})`;
      statements.push(s);
    });

    if (dryrun) {
      wlog(statements);
    } else {
      const script = statements.join(';');
      wlog('running script for ' + filename);
      APIMethods.runScript(script, {}).then(response => {
        wlog('script executed', response);
      });
    }
  });

  function buildTranslation(en: string, fr: string) {
    const cleanFr = lowerCaseFirst(fr ? fr.trim() : '');
    const cleanEn = lowerCaseFirst(en ? en.trim() : '');
    return {
      '@class': 'TranslatableContent',
      translations: {
        EN: { '@class': 'Translation', lang: 'EN', status: '', translation: cleanEn },
        FR: { status: '', translation: cleanFr, lang: 'FR' },
      },
      version: 0,
    };
  }
}

export function updateFromAllTsv(dryrun: boolean): void {
  cache = {};

  const variables: (keyof VariableClasses)[] = [
    'general-interface',
    'human-actions',
    'human-blocks',
    'human-general',
    'human-items',
    'human-pathology',
    'pretriage-explanations',
    'pretriage-interface',
    'qr-interface',
    'general-likert',
    'mainSim-interface',
    'mainSim-actions-tasks',
    'mainSim-actors',
    'trainer-interface',
    'mainSim-locations',
    'mainSim-resources',
    'mainSim-radio',
    'mainSim-summary',
  ];

  variables.forEach(v => {
    wlog('processing', v);
    updateCategoryFromTsv(v + '.tsv', v, dryrun);
  });
}

export function getCurrentLanguageCode(): string {
  return I18n.currentLanguageCode;
}
