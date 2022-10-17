import { translationLogger } from "./logger";

const HUMAN_TRANSLATION_PREFIX = 'human';

/*
type TranslationPrefix = 
	'block' |
	'pathology' |
	'treatment'

function subName(key: string, ...prefixes : TranslationPrefix[]): string {
	return [...prefixes, key].join('.');
}*/

export function getTranslation(category: keyof VariableClasses, key : string) : string {

	// TODO cast ok ?
	const descr = Variable.find(gameModel, category) as SObjectDescriptor;
	if(descr){
		const tr = descr.getProperties()[key];
		if(tr){
			const t = JSON.parse(tr);
			return I18n.translate(t);
		}
	}
	const fallback = category + '/' + key;
	translationLogger.warn('Translation not found', fallback)
	return fallback;
}

export function getBlockTranslation(blockName: string): string {
	return getTranslation('human-block', blockName);
}

export function getPathologyTranslation(pathologyName: string): string {
	return getTranslation('human-pathology', pathologyName);
}

