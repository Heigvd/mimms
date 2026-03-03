// EVALUATION_PRIORITY 1
import { ActDefinition, ItemDefinition } from '../HUMAn/pathology';
import { upperCaseFirst } from './helper';
import { translationLogger } from './logger';

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
  cache[category] = Variable.find(gameModel, category) as SObjectDescriptor;
  if (cache[category]) {
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

export function getCurrentLanguageCode(): string {
  return I18n.currentLanguageCode;
}

export function createOrUpdateTranslation(
  value: string,
  existing: ITranslatableContent | undefined
): ITranslatableContent {
  if (existing && existing.translations) {
    existing.translations[I18n.currentLanguageCode] = I18n.createTranslation(value);
    existing.version++;
    return existing;
  } else {
    return I18n.createTranslatableContent(value);
  }
}
