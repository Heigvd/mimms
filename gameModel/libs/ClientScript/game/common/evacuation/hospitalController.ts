import { hospitalInfo } from '../../../gameInterface/mock_data';
import { knownLanguages } from '../../../tools/translation';
import { saveToObjectDescriptor } from '../../../tools/WegasHelper';
import { HospitalId, PatientUnitId } from '../baseTypes';
import { OneMinuteDuration } from '../constants';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { EvacuationSquadType, getSquadDef } from './evacuationSquadDef';
import {
  HospitalDefinition,
  HospitalDefinitionOld,
  HospitalProximity,
  HospitalsConfigVariableDefinition,
  PatientUnitDefinition,
  PatientUnitTypology,
} from './hospitalType';

function getHospitalsConfigVariable(): SObjectDescriptor {
  return Variable.find(gameModel, 'hospitals_config');
}

function getHospitalsDefinition(): HospitalsConfigVariableDefinition {
  const properties = getHospitalsConfigVariable().getProperties();
  return {
    hospitals: properties['hospitals'] ? JSON.parse(properties['hospitals']) : {},
    patientUnits: properties['patientUnits'] ? JSON.parse(properties['patientUnits']) : {},
  };
}

export function getHospitals(): Record<HospitalId, HospitalDefinition> {
  return getHospitalsDefinition().hospitals;
}

export function getPatientUnits(): Record<PatientUnitId, PatientUnitDefinition> {
  return getHospitalsDefinition().patientUnits;
}

export function updatePatientUnitTranslatableData(
  id: PatientUnitId,
  field: string,
  lang: knownLanguages,
  newName: string
) {
  const patientUnits = Helpers.cloneDeep(getHospitalsDefinition().patientUnits);
  patientUnits[id]![field][lang] = newName; // TODO
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: patientUnits,
    hospitals: getHospitalsDefinition().hospitals,
  });
}

export function updatehangePatientUnitName(
  id: PatientUnitId,
  lang: knownLanguages,
  newName: string
) {
  const patientUnits = Helpers.cloneDeep(getHospitalsDefinition().patientUnits);
  patientUnits[id]!['name'][lang] = newName;
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: patientUnits,
    hospitals: getHospitalsDefinition().hospitals,
  });
}

export function deletePatientUnit(patientUnitId: PatientUnitId) {
  const patientUnits = Helpers.cloneDeep(getHospitalsDefinition().patientUnits);
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);

  const removedIndex: number = patientUnits[patientUnitId].index;

  delete patientUnits[patientUnitId];

  Object.values(patientUnits).forEach(patUni => {
    if (patUni.index > removedIndex) {
      patUni.index--;
    }
  });

  Object.values(hospitals).forEach(hosp => {
    delete hosp.units[patientUnitId];
  });

  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: patientUnits,
    hospitals: hospitals,
  });
}

export function insertPatientUnit() {
  const patientUnits = Helpers.cloneDeep(getHospitalsDefinition().patientUnits);
  const newId = generateNewId(6, Object.keys(patientUnits));
  const newPatientUnit: PatientUnitDefinition = {
    index: Object.values(patientUnits).length,
    name: { fr: '', en: '' },
  };
  patientUnits[newId] = newPatientUnit;
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: patientUnits,
    hospitals: getHospitalsDefinition().hospitals,
  });
}

export type Direction = 'increment' | 'decrement';

export function updateHospitalIndex(id: HospitalId, direction: Direction) {
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);

  const oldIndex = hospitals[id]!['index'];
  let newIndex = 0;
  if (direction === 'decrement') {
    newIndex = oldIndex - 1;
  } else {
    newIndex = oldIndex + 1;
  }

  const neighbourId: PatientUnitId | undefined = Object.keys(hospitals).find(
    key => hospitals[key]!.index === newIndex
  );
  if (neighbourId) {
    hospitals[neighbourId]!['index'] = oldIndex;
  }
  hospitals[id]!['index'] = newIndex;

  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

export function updatePatientUnitIndex(id: PatientUnitId, direction: Direction) {
  const patientUnits = Helpers.cloneDeep(getHospitalsDefinition().patientUnits);

  const oldIndex = patientUnits[id]!['index'];
  let newIndex = 0;
  if (direction === 'decrement') {
    newIndex = oldIndex - 1;
  } else {
    newIndex = oldIndex + 1;
  }

  const neighbourId: PatientUnitId | undefined = Object.keys(patientUnits).find(
    key => patientUnits[key]!.index === newIndex
  );
  if (neighbourId) {
    patientUnits[neighbourId]!['index'] = oldIndex;
  }
  patientUnits[id]!['index'] = newIndex;

  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: patientUnits,
    hospitals: getHospitalsDefinition().hospitals,
  });
}

export function deleteHospital(id: HospitalId) {
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);

  const removedIndex: number = hospitals[id].index;

  delete hospitals[id];

  Object.values(hospitals).forEach(hosp => {
    if (hosp.index > removedIndex) {
      hosp.index--;
    }
  });

  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

export function insertHospital() {
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);
  const newId = generateNewId(6, Object.keys(hospitals));

  hospitals[newId] = {
    index: Object.values(hospitals).length,
    fullName: '',
    shortName: '',
    preposition: { fr: '', en: '' },
    distance: 0,
    proximity: 0,
    units: {},
  };
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

function generateNewId(length: number, existing: string[]): string {
  const maxTries = 6;

  let id = generateId(length);
  let nbTry = 1;
  while (existing.includes(id) && nbTry > maxTries) {
    id = generateId(length);
    nbTry++;
  }

  if (existing.includes(id)) {
    id = 'abc';
  }

  return id;
}

function generateId(length: number) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let id = '';
  for (let i = 0; i < length; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return id;
}

export function updateHospitalData(id: HospitalId, field: string, newData: any) {
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);
  hospitals[id]![field] = newData; // TODO
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

export function updateHospitalTranslatableData(
  id: HospitalId,
  field: string,
  lang: knownLanguages,
  newData: any
) {
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);
  hospitals[id]![field][lang] = newData; // TODO
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

export function updateHospitalUnitCapacity(
  hospitalId: HospitalId,
  patientUnitId: PatientUnitId,
  qty: number
) {
  const hospitals = Helpers.cloneDeep(getHospitalsDefinition().hospitals);
  if (qty === 0) {
    delete hospitals[hospitalId]!.units[patientUnitId];
  } else {
    hospitals[hospitalId]!.units[patientUnitId] = qty;
  }
  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

export function getHospitalsByProximity(proximity: HospitalProximity): HospitalDefinition[] {
  return getHospitals().filter(h => proximity.valueOf() >= h.proximity);
}

/* old */

// -------------------------------------------------------------------------------------------------
// hospital
// -------------------------------------------------------------------------------------------------

export function getHospitalById(hospitalId: HospitalId): HospitalDefinitionOld {
  return hospitalInfo.find(hospital => hospital.hospitalId === hospitalId)!;
}

export function getHospitalsByProximityOld(proximity: HospitalProximity): HospitalDefinitionOld[] {
  // Hardcoded, hospital data should be retrieved from scenarist inputs
  return hospitalInfo.filter(h => proximity.valueOf() >= h.proximity);
}

export function getAllHospitals(): HospitalDefinitionOld[] {
  return hospitalInfo;
}

export function getHospitalsMentionedByCasu(state: Readonly<MainSimulationState>) {
  const proximityRequested = state.getInternalStateObject().hospital.proximityWidestRequest;
  if (proximityRequested) {
    return getHospitalsByProximityOld(proximityRequested);
  }

  return [];
}

/**
 * @param hospitalId the hospital
 * @param squadType the squad that go to the hospital
 *
 * @return The number of time slices needed to go to the hospital
 */
export function computeTravelTime(hospitalId: HospitalId, squadType: EvacuationSquadType): number {
  const squad = getSquadDef(squadType);
  const distance = getHospitalById(hospitalId).distance;

  return Math.ceil(
    (squad.loadingTime + (distance / squad.speed) * 60 + squad.unloadingTime) * OneMinuteDuration
  );
}

export function formatTravelTimeToMinutes(travelTime: number): number {
  return travelTime > 0 ? Math.ceil(travelTime / OneMinuteDuration) : 0;
}

// -------------------------------------------------------------------------------------------------
// hospital patient unit typology
// -------------------------------------------------------------------------------------------------

export function getPatientUnitByHospital(hospitalId: HospitalId): PatientUnitTypology[] {
  const hospital = getHospitalById(hospitalId);
  return hospital.units.flatMap(unit => unit.placeType.typology);
}

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
