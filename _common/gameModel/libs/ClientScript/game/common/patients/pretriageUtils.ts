import { getTranslatedRecordAsString, getTranslation } from '../../../tools/translation';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { SimTime } from '../baseTypes';
import { PatientState } from '../simulationState/patientState';
import { STANDARD_CATEGORY, STANDARD_CATEGORY_ARRAY } from '../../pretri/triage';
import { keys } from '../../../tools/helper';

export function formatStandardPretriageReport(
  pretriageSnapShot: Readonly<PretriageSnapShot>,
  pretriageLocation: LOCATION_ENUM,
  feedbackReportTranslationPrefix: string,
  completedTask: boolean,
  includeNonPretriagedInfo: boolean
): string {
  const patientsStats =
    pretriageSnapShot.patientsStats[pretriageLocation] ?? getEmptyPatientsStats();

  const pretriagedString = getTranslatedRecordAsString(
    getPretriagedAmountByCategory(patientsStats),
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
    (includeNonPretriagedInfo && patientsStats.uncategorized > 0
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
 * @returns the amount of pretriaged patients per category, categories without any patient are omitted
 */
function getPretriagedAmountByCategory(
  patientsStats: Readonly<Record<PATIENT_CATEGORY, number>>
): Partial<Record<STANDARD_CATEGORY, number>> {
  const amountsByCategory: Partial<Record<STANDARD_CATEGORY, number>> = {};

  STANDARD_CATEGORY_ARRAY.filter(category => patientsStats[category] > 0).forEach(
    category => (amountsByCategory[category] = patientsStats[category])
  );

  return amountsByCategory;
}

/**
 * @returns the amount of pretriaged patients, whatever their category
 */
function getPretriagedPatientsCount(
  patientsStats: Readonly<Record<PATIENT_CATEGORY, number>>
): number {
  return STANDARD_CATEGORY_ARRAY.reduce((count, category) => count + patientsStats[category], 0);
}

/**
 * @returns the locations holding at least one pretriaged patient
 */
export function getLocationsWithPretriagedPatients(
  pretriageSnapShot: Readonly<PretriageSnapShot>
): LOCATION_ENUM[] {
  return keys(pretriageSnapShot.patientsStats).filter(
    location => getPretriagedPatientsCount(pretriageSnapShot.patientsStats[location]!) > 0
  );
}

/**
 * Counts, per location, the number of patients in each pretriage category
 * Hospitals are ignored
 */
export function generateSnapShot(state: Readonly<MainSimulationState>): PretriageSnapShot {
  const patientsStats: PretriageSnapShot['patientsStats'] = {};

  state.getAllPatients().forEach(patient => {
    if (patient.location.kind === 'FixedMapEntity') {
      const stats = (patientsStats[patient.location.locationId] ??= getEmptyPatientsStats());
      stats[getPatientCategory(patient)]++;
    }
  });

  return {
    timeStamp: state.getSimTime(),
    patientsStats: patientsStats,
  };
}
