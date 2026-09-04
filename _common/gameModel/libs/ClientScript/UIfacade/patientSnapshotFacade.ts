import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import {
  getLocationsWithPretriagedPatients,
  PretriageSnapShot,
} from '../game/common/patients/pretriageUtils';
import { getCurrentState } from '../game/mainSimulationLogic';
import { SimTime } from '../game/common/baseTypes';
import {
  STANDARD_CATEGORY,
  STANDARD_CATEGORY_ARRAY,
  STANDARD_CATEGORY_COLORS,
} from '../game/pretri/triage';
import { getTranslation } from '../tools/translation';

export interface PatientCategoryColorLegendEntry {
  categoryId: STANDARD_CATEGORY;
  color: string;
  label: string;
  count: number;
}

/**
 * @returns The latest global pretriage snapshot stored in the current simulation state
 */
export function getPretriageSnapShot(): Readonly<PretriageSnapShot> {
  return getCurrentState().getInternalStateObject().pretriageSnapShot;
}

/**
 * @returns The simulation time at which the current pretriage snapshot was generated
 */
export function getPretriageSnapShotTimeStamp(): SimTime {
  return getPretriageSnapShot().timeStamp;
}

/**
 * @returns The pretriage stats (amount of patients per category) for the given location,
 * or undefined if no snapshot has been taken for that location yet
 */
export function getPretriageStatsForLocation(
  location: LOCATION_ENUM
): Readonly<PretriageSnapShot['patientsStats'][LOCATION_ENUM]> {
  return getPretriageSnapShot().patientsStats[location];
}

/**
 * @returns The total number of patients accounted for in the current pretriage snapshot for the
 * given location, across all categories, or 0 if no snapshot has been taken for that location yet
 */
export function getTotalPatientsCountForLocation(location: LOCATION_ENUM): number {
  const stats = getPretriageStatsForLocation(location);
  if (stats == undefined) return 0;

  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}

export function shortPatientInfo(location: LOCATION_ENUM): string {
  const pretriageStatus = getPretriageStatsForLocation(location);
  const immediate = pretriageStatus?.immediate ?? 0;
  const totalPatientsForLocation = getTotalPatientsCountForLocation(location);
  return `<span class=\"red-patients-counter\">${immediate}</span>/${totalPatientsForLocation}`;
}

/**
 * @returns The locations that hold at least one pretriaged patient in the current snapshot
 */
export function getLocationsWithSnapshot(): LOCATION_ENUM[] {
  return getLocationsWithPretriagedPatients(getPretriageSnapShot());
}

/**
 * @returns The color legend for the standard pretriage categories that have at least one patient
 * for the given location, along with the amount of patients in each category
 */
export function getPatientCategoryColorLegend(
  location: LOCATION_ENUM
): PatientCategoryColorLegendEntry[] {
  const stats = getPretriageStatsForLocation(location);
  if (stats == undefined) return [];

  return STANDARD_CATEGORY_ARRAY.filter(categoryId => stats[categoryId] > 0).map(categoryId => ({
    categoryId,
    color: STANDARD_CATEGORY_COLORS[categoryId],
    label: getTranslation('mainSim-actions-tasks', 'pretriage-category-' + categoryId),
    count: stats[categoryId],
  }));
}

const STANDARD_CATEGORY_COLOR_CLASS_NAMES: Record<STANDARD_CATEGORY, string> = {
  dead: 'patient-color--black',
  immediate: 'patient-color--red',
  urgent: 'patient-color--yellow',
  non_urgent: 'patient-color--green',
};

/**
 * @returns The CSS class matching the color of the given standard pretriage category
 * (see patient.css)
 */
export function getPatientCategoryColorClassName(categoryId: STANDARD_CATEGORY): string {
  return STANDARD_CATEGORY_COLOR_CLASS_NAMES[categoryId];
}
