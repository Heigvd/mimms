import { getTranslatedRecordAsString, getTranslation } from '../../../tools/translation';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNonPreTriagedPatientsSize,
  getPreTriagedAmountByCategory,
} from '../simulationState/patientState';
import { SimTime } from '../baseTypes';
import { PatientState } from '../simulationState/patientState';
import { STANDARD_CATEGORY, STANDARD_CATEGORY_ARRAY } from '../../pretri/triage';

export function formatStandardPretriageReport(
  state: Readonly<MainSimulationState>,
  pretriageLocation: LOCATION_ENUM,
  feedbackReportTranslationPrefix: string,
  completedTask: boolean,
  includeNonPretriagedInfo: boolean
): string {
  const pretriagedString = getTranslatedRecordAsString(
    getPreTriagedAmountByCategory(state, pretriageLocation),
    'mainSim-actions-tasks',
    'pretriage-category-'
  );
  return (
    (completedTask
      ? getTranslation('mainSim-locations', 'location-' + pretriageLocation) +
        ' - ' +
        getTranslation('mainSim-actions-tasks', 'pretriage-task-completed')
      : getTranslation('mainSim-actions-tasks', feedbackReportTranslationPrefix + 'Intro', true, [
          getTranslation('mainSim-locations', 'location-' + pretriageLocation),
        ])) +
    '\n\n' +
    (includeNonPretriagedInfo && getNonPreTriagedPatientsSize(state, pretriageLocation) > 0
      ? getTranslation(
          'mainSim-actions-tasks',
          feedbackReportTranslationPrefix + 'NonPretriaged',
          false
        ) + '\n\n'
      : '') +
    getTranslation('mainSim-actions-tasks', feedbackReportTranslationPrefix + 'Report', false) +
    '\n\n' +
    (pretriagedString.length > 0 ? pretriagedString : 'N/A')
  );
}

type PATIENT_CATEGORY = STANDARD_CATEGORY | 'uncategorized';

export interface PretriageSnapShot {
  timeStamp: SimTime;
  patientsStats: Partial<Record<LOCATION_ENUM, Record<PATIENT_CATEGORY, number>>>;
}

/**
 * @returns a stats record with all categories set to zero
 */
function getEmptyPatientsStats(): Record<PATIENT_CATEGORY, number> {
  const stats: Record<PATIENT_CATEGORY, number> = { uncategorized: 0 } as Record<
    PATIENT_CATEGORY,
    number
  >;

  STANDARD_CATEGORY_ARRAY.forEach(category => (stats[category] = 0));

  return stats;
}

/**
 * Categories outside of the standard ones (SACCO, swiss systems, ...) and patients
 * that have not been pretriaged yet are counted as 'uncategorized'
 */
function getPatientCategory(patient: Readonly<PatientState>): PATIENT_CATEGORY {
  const categoryId = patient.preTriageResult?.categoryId;

  if (
    categoryId !== undefined &&
    (STANDARD_CATEGORY_ARRAY as readonly string[]).includes(categoryId)
  ) {
    return categoryId as STANDARD_CATEGORY;
  }

  return 'uncategorized';
}

/**
 * Counts, per location, how many patients are in each pretriage category at the current sim time
 */
export function generateSnapShot(state: Readonly<MainSimulationState>): PretriageSnapShot {
  const patientsStats: PretriageSnapShot['patientsStats'] = {};

  state.getAllPatients().forEach(patient => {
    if (patient.location.kind !== 'FixedMapEntity') {
      return;
    }

    const stats = (patientsStats[patient.location.locationId] ??= getEmptyPatientsStats());
    stats[getPatientCategory(patient)]++;
  });

  return {
    timeStamp: state.getSimTime(),
    patientsStats: patientsStats,
  };
}
