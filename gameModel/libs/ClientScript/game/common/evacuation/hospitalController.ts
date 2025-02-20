import { knownLanguages } from '../../../tools/translation';
import { saveToObjectDescriptor } from '../../../tools/WegasHelper';
import { HospitalId, PatientUnitId } from '../baseTypes';
import { OneMinuteDuration } from '../constants';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { EvacuationSquadType, getSquadDef } from './evacuationSquadDef';
import {
  HospitalDefinition,
  HospitalProximity,
  HospitalsConfigVariableDefinition,
  PatientUnitDefinition,
} from './hospitalType';

export type Direction = 'increment' | 'decrement';

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

// -------------------------------------------------------------------------------------------------
// Hospital
// -------------------------------------------------------------------------------------------------

export function getHospitals(): Record<HospitalId, HospitalDefinition> {
  return getHospitalsDefinition().hospitals;
}

export function getHospitalById(hospitalId: HospitalId): HospitalDefinition {
  return getHospitals()[hospitalId]!;
}

export function getHospitalsByProximity(
  proximity: HospitalProximity
): Record<HospitalId, HospitalDefinition> {
  const result = { ...getHospitals() };
  const ids = Object.keys({ ...result });

  ids.forEach(hospId => {
    const hospProximity = result[hospId]?.proximity;
    if (hospProximity == undefined || proximity.valueOf() < hospProximity) {
      delete result[hospId];
    }
  });

  return result;
}

// Could be used by evacuationFacade.getEvacHospitalsChoices()
export function getHospitalsMentionedByCasu(
  state: Readonly<MainSimulationState>
): Record<HospitalId, HospitalDefinition> {
  const proximityRequested = state.getInternalStateObject().hospital.proximityWidestRequest;
  if (proximityRequested !== undefined) {
    return getHospitalsByProximity(proximityRequested);
  }

  return {};
}

export function insertHospital() {
  const hospitals: Record<HospitalId, HospitalDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().hospitals
  );

  const newId = generateNewId(6, Object.keys(hospitals));

  hospitals[newId] = {
    index: Object.values(hospitals).length + 1,
    fullName: '',
    shortName: '',
    preposition: { fr: 'à', en: 'to' },
    distance: 0,
    proximity: 1,
    units: {},
  };

  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: getHospitalsDefinition().patientUnits,
    hospitals: hospitals,
  });
}

// builds a type which properties are only of the condition type
type FilterConditionally<Source, Condition> = Pick<Source, {[K in keyof Source]: Source[K] extends Condition ? K : never}[keyof Source]>;

export function updateHospitalData<T = number | string>(
  id: HospitalId,
  field: keyof FilterConditionally<HospitalDefinition, T>,
  newData: T,
) {
  const hospitals: Record<HospitalId, HospitalDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().hospitals
  );
  const h = hospitals[id];
  if (h != undefined) {
    h[field] = newData as any;

    saveToObjectDescriptor(getHospitalsConfigVariable(), {
      patientUnits: getHospitalsDefinition().patientUnits,
      hospitals: hospitals,
    });
  }
}

export function updateHospitalTranslatableData(
  id: HospitalId,
  field: keyof HospitalDefinition,
  lang: knownLanguages,
  newData: string
) {
  const hospitals: Record<HospitalId, HospitalDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().hospitals
  );

  if (hospitals[id] != undefined) {
    // hospitals[id]![field] = newData; // does not compile
    if (field === 'preposition') {
      hospitals[id]![field][lang] = newData;
    }

    saveToObjectDescriptor(getHospitalsConfigVariable(), {
      patientUnits: getHospitalsDefinition().patientUnits,
      hospitals: hospitals,
    });
  }
}

export function updateHospitalIndex(id: HospitalId, direction: Direction) {
  const hospitals: Record<HospitalId, HospitalDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().hospitals
  );

  if (hospitals[id] != undefined) {
    const oldIndex = hospitals[id]!['index'];
    let newIndex = 0;
    if (direction === 'decrement') {
      newIndex = oldIndex - 1;
    } else {
      newIndex = oldIndex + 1;
    }

    if (newIndex > 0 && newIndex < Object.values(hospitals).length + 1) {
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
  }
}

export function deleteHospital(id: HospitalId) {
  const hospitals: Record<HospitalId, HospitalDefinition> = getHospitalsDefinition().hospitals;

  if (hospitals[id] != undefined) {
    const removedIndex: number = hospitals[id]!.index;

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
}

export function updateHospitalUnitCapacity(
  hospitalId: HospitalId,
  patientUnitId: PatientUnitId,
  qty: number
) {
  const hospitals: Record<HospitalId, HospitalDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().hospitals
  );

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

// -------------------------------------------------------------------------------------------------
// Patient unit
// -------------------------------------------------------------------------------------------------

export function getPatientUnits(): Record<PatientUnitId, PatientUnitDefinition> {
  return getHospitalsDefinition().patientUnits;
}

export function getPatientUnitById(patientUnitId: PatientUnitId): PatientUnitDefinition {
  return getHospitalsDefinition().patientUnits[patientUnitId]!;
}

export function getPatientUnitIdsSorted(): PatientUnitId[] {
  return Object.entries(getPatientUnits())
    .map(([patientUnitId, patientUnit]) => ({ ...patientUnit, id: patientUnitId }))
    .sort((a, b) => {
      return a.index - b.index;
    })
    .map(pu => pu.id);
}

export function insertPatientUnit() {
  const patientUnits: Record<PatientUnitId, PatientUnitDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().patientUnits
  );

  const newId = generateNewId(6, Object.keys(patientUnits));

  patientUnits[newId] = {
    index: Object.values(patientUnits).length + 1,
    name: { fr: '', en: '' },
  };

  saveToObjectDescriptor(getHospitalsConfigVariable(), {
    patientUnits: patientUnits,
    hospitals: getHospitalsDefinition().hospitals,
  });
}

export function updatePatientUnitTranslatableData(
  id: PatientUnitId,
  field: keyof PatientUnitDefinition,
  lang: knownLanguages,
  newName: string
) {
  const patientUnits: Record<PatientUnitId, PatientUnitDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().patientUnits
  );

  if (patientUnits[id] != undefined) {
    // patientUnits[id]![field][lang] = newName; // does not compile
    // So we put some conditions about typing
    if (field === 'name') {
      patientUnits[id]![field][lang] = newName;
    }

    saveToObjectDescriptor(getHospitalsConfigVariable(), {
      patientUnits: patientUnits,
      hospitals: getHospitalsDefinition().hospitals,
    });
  }
}

export function updatePatientUnitIndex(id: PatientUnitId, direction: Direction) {
  const patientUnits: Record<PatientUnitId, PatientUnitDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().patientUnits
  );

  if (patientUnits[id] != undefined) {
    const oldIndex = patientUnits[id]!['index'];
    let newIndex = 0;
    if (direction === 'decrement') {
      newIndex = oldIndex - 1;
    } else {
      newIndex = oldIndex + 1;
    }

    if (newIndex > 0 && newIndex < Object.values(patientUnits).length + 1) {
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
  }
}

export function deletePatientUnit(patientUnitId: PatientUnitId) {
  const patientUnits: Record<PatientUnitId, PatientUnitDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().patientUnits
  );
  const hospitals: Record<HospitalId, HospitalDefinition> = Helpers.cloneDeep(
    getHospitalsDefinition().hospitals
  );

  if (patientUnits[patientUnitId]) {
    const removedIndex: number = patientUnits[patientUnitId]!.index;

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
}

// -------------------------------------------------------------------------------------------------
// Travel time to hospital
// -------------------------------------------------------------------------------------------------

/**
 * @param hospitalId the hospital
 * @param squadType the squad that go to the hospital
 *
 * @return The number of time slices needed to go to the hospital
 */
export function computeTravelTime(hospitalId: HospitalId, squadType: EvacuationSquadType): number {
  const squad = getSquadDef(squadType);
  const distance = getHospitalById(hospitalId).distance ?? 0;

  return Math.ceil(
    (squad.loadingTime + (distance / squad.speed) * 60 + squad.unloadingTime) * OneMinuteDuration
  );
}

export function formatTravelTimeToMinutes(travelTime: number): number {
  return travelTime > 0 ? Math.ceil(travelTime / OneMinuteDuration) : 0;
}

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------

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
