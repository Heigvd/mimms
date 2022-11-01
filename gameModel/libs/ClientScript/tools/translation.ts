import { translationLogger } from "./logger";


const cache : Record<string, SObjectDescriptor> = {};

export function getTranslation(category: keyof VariableClasses, key : string, upperCaseFirstLetter = true) : string {

	// TODO cache translations ?

	if(!cache[category]){
		cache[category] = Variable.find(gameModel, category) as SObjectDescriptor;
	}
	if(cache[category]){
		//TODO cache parsed ?
		const tr = cache[category].getProperties()[key];
		if(tr){
			const t = JSON.parse(tr);
			const translated = I18n.translate(t);
			if(translated){
				return upperCaseFirstLetter ? upperCaseFirst(translated) : translated;
			}
		}
	}
	const fallback = '::' + category + '/' + key;
	translationLogger.info('Translation not found', fallback)
	return fallback;
}

export function translationExists(category: keyof VariableClasses, key : string): boolean {

	if(!cache[category]){
		cache[category] = Variable.find(gameModel, category) as SObjectDescriptor;
	}
	if(cache[category]){
		const tr = cache[category].getProperties()[key];
		if(tr){
			return true;
		}
	}
	return false;
}

export function getBlockTranslation(blockName: string): string {
	return getTranslation('human-blocks', blockName);
}

export function getPathologyTranslation(pathologyName: string): string {
	return getTranslation('human-pathology', pathologyName);
}

/**
 * get translation for an item or an action 
 */
export function getItemActionTranslation(actionOrItemName : string, upperCaseFirstLetter? : boolean) : string {

	if(translationExists('human-items', actionOrItemName)){
		return getTranslation('human-items', actionOrItemName, upperCaseFirstLetter);
	}else{
		return getTranslation('human-actions', actionOrItemName, upperCaseFirstLetter);
	}

}

export function upperCaseFirst(s: string): string {
	if(s && s.length > 0) return s.charAt(0).toUpperCase() + s.slice(1);
	return s;
}

export function lowerCaseFirst(s: string): string {
	if(s && s.length > 0) return s.charAt(0).toLowerCase() + s.slice(1);
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
function updateCategoryFromTsv(filename: string, category: keyof VariableClasses, dryrun:boolean){

	Helpers.downloadFile(`translations/${filename}`, 'TEXT').then( tsv => {

		if(tsv.startsWith('<!DOCTYPE')){ // TODO should be empty or raise and error
			wlog('tsv file not found : ' +  filename);
			return;
		}
		const lines = tsv.split('\n');
		const header = lines[0].split('\t');
		if(header[1].trim() !== 'EN' || header[2].trim() !== 'FR'){
			
			throw new Error(filename + ' bad format, expected header : key, EN, FR, <any>. received : ' + header)
		}

		const statements : string [] = [];

		lines.slice(1).forEach(line => {
			const l = line.split('\t');
			if(!l) {return;}
			const tr = buildTranslation(l[1], l[2]);
			const key = l[0].trim();
			const s = `Variable.find(gameModel, "${category}").setProperty('${key}', ${JSON.stringify(JSON.stringify(tr))})`;
			statements.push(s);
		})

		if(dryrun) {
			wlog(statements)
		}else{
			const script = statements.join(';');
			APIMethods.runScript(script, {}).then(response => {
				wlog('script executed', response);
			});
		}

	});

	function buildTranslation(en: string, fr: string){
		const cleanFr = lowerCaseFirst(fr ? fr.trim() : '');
		const cleanEn = lowerCaseFirst(en ? en.trim() : '');
		return {
			"@class":"TranslatableContent",
			"translations":{
				"EN":{"@class":"Translation","lang":"EN","status":"","translation": cleanEn},
				"FR":{"status":"","translation": cleanFr,"lang":"FR"}
			},
			"version":0
		}
	}

}

export function updateFromAllTsv(dryrun: boolean):void {

	const variables : (keyof VariableClasses)[] = [
		'pretriage-interface',
		'pretriage-explanations',
		//'pretriage-algorithms',
		'human-actions',
		'human-items',
		'human-blocks',
		'human-general',
		'human-pathology'
	]

	variables.forEach(v => {
		wlog('processing', v);
		updateCategoryFromTsv(v + '.tsv', v, dryrun);
	})
}

