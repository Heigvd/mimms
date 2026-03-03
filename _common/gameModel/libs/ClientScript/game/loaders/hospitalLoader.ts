import { HospitalId, PatientUnitId } from '../common/baseTypes';
import {
  HospitalDefinition,
  HospitalProximity,
  HospitalsConfigVariableDefinition,
  PatientUnitDefinition,
} from '../common/evacuation/hospitalType';

let hospitalsConfigCache: HospitalsConfigVariableDefinition | undefined;

export function getHospitalsConfigVariable(): SObjectDescriptor {
  return Variable.find(gameModel, 'hospitals_config');
}

export function getHospitalsDefinition(): HospitalsConfigVariableDefinition {
  const properties = getHospitalsConfigVariable().getProperties();
  return {
    hospitals: properties['hospitals'] ? JSON.parse(properties['hospitals']) : {},
    patientUnits: properties['patientUnits'] ? JSON.parse(properties['patientUnits']) : {},
  };
}

Helpers.registerEffect(() => {
  hospitalsConfigCache = undefined;
});

export function resetHospitalCache(): void {
  hospitalsConfigCache = undefined;
}

function getCachedHospitalsDef(): HospitalsConfigVariableDefinition {
  if (!hospitalsConfigCache) {
    hospitalsConfigCache = getHospitalsDefinition();
  }
  return hospitalsConfigCache;
}

export function getCachedHospitals(): HospitalsConfigVariableDefinition['hospitals'] {
  return getCachedHospitalsDef().hospitals;
}

export function getCachedHospitalById(hospitalId: HospitalId): HospitalDefinition {
  return getCachedHospitals()[hospitalId]!;
}

export function getCachedHospitalsByProximity(
  proximity: HospitalProximity
): Record<HospitalId, HospitalDefinition> {
  const result: Record<HospitalId, HospitalDefinition> = {};
  const prox = proximity || HospitalProximity.International;
  Object.entries(getCachedHospitals()).forEach(([id, hospital]) => {
    if (hospital.proximity && prox.valueOf() >= hospital.proximity) {
      result[id] = hospital;
    }
  });

  return result;
}

//*********** PATIENT UNITS ****************/

export function getCachedPatientUnits(): HospitalsConfigVariableDefinition['patientUnits'] {
  return getCachedHospitalsDef().patientUnits;
}

export function getCachedPatientUnitById(patientUnitId: PatientUnitId): PatientUnitDefinition {
  return getCachedPatientUnits()[patientUnitId]!;
}

export function getCachedPatientUnitIdsSorted(): PatientUnitId[] {
  return Object.entries(getCachedPatientUnits())
    .map(([patientUnitId, patientUnit]) => ({ ...patientUnit, id: patientUnitId }))
    .sort((a, b) => {
      return a.index - b.index;
    })
    .map(pu => pu.id);
}
