import {
  getPatientsBodyFactoryParamsArray,
  parse,
  parseObjectDescriptor,
  saveToObjectDescriptor,
} from '../tools/WegasHelper';
import { DataDef, MatrixConfig } from './MatrixEditor';

const onPresetChangeRefName = 'presetDefOnChange';
const onPresetChangeRef = Helpers.useRef<PresetOnChangeFn>(onPresetChangeRefName, () => {});

const onPresetsUpdateRefName = 'updatePresetsRef';
const onPresetsUpdateRef = Helpers.useRef<PresetsUpdateFn>(onPresetsUpdateRefName, () => {});

const onPresetsDeleteRefName = 'deletePresetsRef';
const onPresetsDeleteRef = Helpers.useRef<(id: number) => void>(onPresetsDeleteRefName, () => {});

type PresetOnChangeFn = (
  x: DataDef<PatientPresetId>,
  y: DataDef<PatientId>,
  value: PatientPresetMatrixCell
) => void;
type PresetsUpdateFn = (x: DataDef<PatientPresetId>) => void;

type PatientPresetId = string;

export type PatientPreset = {
  name: string;
  patients: Record<string, boolean>;
};

type PatientId = string;
type PatientPresetMatrixCell = undefined | boolean;

const patientPresetsVarName = 'drill_Presets';

export function getPatientPreset(presetId: string): PatientPreset | null {
  const preset = Variable.find(gameModel, patientPresetsVarName).getProperties()[presetId];
  return parse<PatientPreset>(preset || '');
}

export function getPresetByName(name: string): PatientPreset | undefined | null {
  return Object.values(Variable.find(gameModel, patientPresetsVarName).getProperties())
    .map(presetString => parse<PatientPreset>(presetString || ''))
    .find(preset => preset!.name === name);
}

export function getPatientsParamsFromPreset(presetId: string) {
  const preset = getPatientPreset(presetId);
  const patients = getPatientsBodyFactoryParamsArray();
  if (preset) {
    return patients.filter(p => preset!.patients[p.id]);
  } else {
    return patients;
  }
}

function getPatientPresets() {
  return parseObjectDescriptor<PatientPreset>(Variable.find(gameModel, patientPresetsVarName));
}

export function clearAllPatientsFromPresets() {
  const presets = getPatientPresets();
  Object.values(presets).forEach(p => (p.patients = {}));
  const presetsDesc = Variable.find(gameModel, patientPresetsVarName);
  saveToObjectDescriptor(presetsDesc, presets);
}

export function removePatientFromPresets(patientId: string): void {
  const presets = getPatientPresets();
  let changes = false;
  wlog(presets);
  Object.values(presets).forEach(p => {
    if (p.patients[patientId]) {
      changes = true;
      delete p.patients[patientId];
    }
  });

  if (changes) {
    const presetsDesc = Variable.find(gameModel, patientPresetsVarName);
    saveToObjectDescriptor(presetsDesc, presets);
    wlog(presets);
  }
}

export function getPresetsAsChoices(): { label: string; value: string }[] {
  const choices = Object.entries(getPatientPresets()).map(([k, v]) => {
    return { label: v.name, value: k };
  });
  choices.push({ label: 'All', value: '' });
  return choices;
}

export function getPatientPresetMatrix(): MatrixConfig<
  PatientPresetId,
  PatientId,
  PatientPresetMatrixCell
> {
  const patients = getPatientsBodyFactoryParamsArray().sort((a, b) => {
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
      //.sort(([,a], [,b]) => compare(a.name, b.name))
      .map(([id, preset]) => ({
        id: id,
        label: preset.name || 'unamed',
      })),
    data: matrix,
    cellDef: [
      {
        type: 'boolean',
        label: '',
      },
    ],
    onChangeRefName: onPresetChangeRefName,
    dataDefChangeColumn: {
      enableCreation: true,
      createdEntryDefaultLabel: 'New preset',
      addEntryButtonLabel: 'Add new preset',
      callbackRefName: onPresetsUpdateRefName,
    },
    dataDefRemoveColumn: onPresetsDeleteRefName,
  };
}

// rename or create preset
onPresetsUpdateRef.current = x => {
  let updatedPreset = getPatientPresets()[x.id];
  if (updatedPreset) {
    updatedPreset.name = x.label;
  } else {
    // create new
    updatedPreset = { name: x.label, patients: {} };
  }
  const id = x.id;

  persistPreset(id, updatedPreset);
};

// delete preset
onPresetsDeleteRef.current = id => {
  const preset = getPatientPresets()[id];
  if (preset) {
    const script = `Variable.find(gameModel, '${patientPresetsVarName}').removeProperty('${id}');`;
    APIMethods.runScript(script, {});
  } //else, nothing to delete
};

function persistPreset(id: PatientPresetId, preset: PatientPreset) {
  const script = `Variable.find(gameModel, '${patientPresetsVarName}').setProperty('${id}',
		 ${JSON.stringify(JSON.stringify(preset))});`;
  APIMethods.runScript(script, {});
}

onPresetChangeRef.current = (x, y, newData) => {
  const presetId = x.id;
  const patientId = y.id;

  const preset = getPatientPreset(presetId) || { name: '', patients: {} };

  if (newData) {
    if (preset.patients == null) {
      preset.patients = {};
    }
    preset.patients[patientId] = true;
  } else {
    if (preset.patients) {
      delete preset.patients[patientId];
    }
  }

  persistPreset(presetId, preset);
};
