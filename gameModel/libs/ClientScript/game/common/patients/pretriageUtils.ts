import { getTranslatedRecordAsString, getTranslation } from '../../../tools/translation';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  getNonPreTriagedPatientsSize,
  getPreTriagedAmountByCategory,
} from '../simulationState/patientState';

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
    (includeNonPretriagedInfo
      ? getTranslation(
          'mainSim-actions-tasks',
          feedbackReportTranslationPrefix + 'NonPretriaged',
          false,
          [getNonPreTriagedPatientsSize(state, pretriageLocation)]
        ) + '\n\n'
      : '') +
    getTranslation('mainSim-actions-tasks', feedbackReportTranslationPrefix + 'Report', false) +
    '\n\n' +
    (pretriagedString.length > 0 ? pretriagedString : 'N/A')
  );
}
