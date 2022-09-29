import { BodyFactoryParam } from "../HUMAn/human";
import { compare } from "../tools/helper";
import { getPatientsBodyFactoryParamsArray, parse, parseObjectDescriptor } from "../tools/WegasHelper";
import { DataDef, MatrixConfig } from "./MatrixEditor";

const PresetOnChangeRefName = 'presetDefOnChange';
const onPresetChangeRef = Helpers.useRef<PresetOnChangeFn>(PresetOnChangeRefName, () => { });
type PresetOnChangeFn = (x: DataDef<PatientPresetId>, y: DataDef<PatientId>, value: PatientPresetMatrixCell) => void;


type PatientPresetId = string;

type PatientPreset = {
	name: string,
	patients : Record<string, boolean>
}

type PatientId = string;
type PatientPresetMatrixCell = undefined | boolean;

const patientPresetsVarName = 'drill_Presets';

export function getPatientPreset(presetId : string): PatientPreset | null {

	const preset = Variable.find(gameModel, patientPresetsVarName).getProperties()[presetId];
	return parse<PatientPreset>(preset || "");

}

export function getPatientsParamsFromPreset(presetId: string){
	const preset = getPatientPreset(presetId);
	const patients = getPatientsBodyFactoryParamsArray();
	//TODO null case
	return patients.filter((p) => preset!.patients[p.id]);
}

function getPatientPresets(){
	return parseObjectDescriptor<PatientPreset>(Variable.find(gameModel, patientPresetsVarName));
}

export function getPresetsAsChoices(): {label: string, value: string}[]{

	return Object.entries(getPatientPresets())
		.map(([k,v]) => {return {label: v.name, value: k}});
}

export function getPatientPresetMatrix(): MatrixConfig<PatientPresetId, PatientId , PatientPresetMatrixCell> {
	const patients = getPatientsBodyFactoryParamsArray()
		.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
	const presets = getPatientPresets();

	const matrix: Record<PatientPresetId, Record<PatientId, PatientPresetMatrixCell>> = {};

	Object.entries(presets || {}).forEach(([id, preset]) => {
		matrix[id] = {};
		const patients = preset.patients || {};
		Object.keys(patients).forEach(patientId => {
			matrix[id]![patientId] = true;
		});
	});

	return {
		y: patients.map(p => ({
			label: p.id + '\n' + (p.meta.description || ''),
			id: p.id,
		})),
		x: Object.entries(presets)
			.sort(([,a], [,b]) => compare(a.name, b.name))
			.map(([id, preset]) => ({
				id: id,
				label: preset.name || 'unamed',
			})),
		data: matrix,
		cellDef: [
			{
				type: 'boolean',
				label: '',
			}
		],
		onChangeRefName: PresetOnChangeRefName,
	};
}

onPresetChangeRef.current = (x, y, newData) => {

	const presetId = x.id;
	const patientId = y.id;

	const preset = getPatientPreset(presetId) || { name: '', patients : {} };

	if (newData) {
		if (preset.patients == null){
			preset.patients = {};
		}
		preset.patients[patientId] = true;
	} else {
		if (preset.patients){
			delete preset.patients[patientId];
		}
	}

	const script = `Variable.find(gameModel, '${patientPresetsVarName}').setProperty('${presetId}',
		 ${JSON.stringify(JSON.stringify(preset))});`

	APIMethods.runScript(script, {});
};