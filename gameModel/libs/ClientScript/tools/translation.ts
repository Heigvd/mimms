import { translationLogger } from "./logger";


export function getTranslation(category: keyof VariableClasses, key : string) : string {

	const descr = Variable.find(gameModel, category) as SObjectDescriptor;
	if(descr){
		const tr = descr.getProperties()[key];
		if(tr){
			const t = JSON.parse(tr);
			const translated = I18n.translate(t);
			if(translated){
				return translated;
			}
		}
	}
	const fallback = '::' + category + '/' + key;
	translationLogger.info('Translation not found', fallback)
	return fallback;
}

export function getBlockTranslation(blockName: string): string {
	return getTranslation('human-blocks', blockName);
}

export function getPathologyTranslation(pathologyName: string): string {
	return getTranslation('human-pathology', pathologyName);
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
			wlog('empty tsv file');
			return;
		}
		wlog(tsv);
		const lines = tsv.split('\n');
		const header = lines[0].split('\t');
		if(header[1] !== 'EN' || header[2] !== 'FR'){
			throw new Error(filename + ' bad format, expected header : key, EN, FR, <any>')
		}

		const statements : string [] = [];

		lines.slice(1).forEach(line => {
			const l = line.split('\t');
			const tr = buildTranslation(l[1]||'', l[2]||'');
			const key = l[0].trim();
			const s = `Variable.find(gameModel, "${category}").setProperty('${key}', ${JSON.stringify(JSON.stringify(tr))})`;
			statements.push(s);
		})

		if(dryrun) {
			wlog(statements)
			return;
		}else{
			const script = statements.join(';');
			APIMethods.runScript(script, {}).then(response => {
				wlog('script executed', response);
			});
		}

	});

	function buildTranslation(en: string, fr: string){
		return {
			"@class":"TranslatableContent",
			"translations":{
				"EN":{"@class":"Translation","lang":"EN","status":"","translation": en.trim()},
				"FR":{"status":"","translation": fr.trim(),"lang":"FR"}
			},
			"version":0
		}
	}

}

export function updateFromAllTsv(dryrun: boolean):void {

	const variables : (keyof VariableClasses)[] = [
		'pretriage-interface',
		'pretriage-algorithms',
		'human-actions',
		'human-blocks',
		'human-general',
		'human-pathology'
	]

	variables.forEach(v => {
		wlog(v);
		updateCategoryFromTsv(v + '.tsv', v, dryrun);
	})
}

