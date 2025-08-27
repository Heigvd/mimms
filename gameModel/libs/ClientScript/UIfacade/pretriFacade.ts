import { getCategorizedHumans } from '../game/legacy/the_world';
import { getDrillStatus } from '../game/pretri/drill';
import { toHoursMinutesSecondsIso } from '../tools/helper';
import { getTranslation } from '../tools/translation';
import { getSortedPatientIds } from '../tools/WegasHelper';

/**
 * Returns the latest stored pretri time in drill games
 */
export function getFormattedPretriTime(): string {
  const t = Variable.find(gameModel, 'latest_pretri_time').getValue(self);
  const time = toHoursMinutesSecondsIso(t);
  const timeLabel = getTranslation('pretriage-interface', 'time');
  return `${timeLabel} ${time}`;
}

export function actionsBlocked(): boolean {
  return getDrillStatus() !== 'ongoing' && Variable.find(gameModel, 'examMode').getValue(self);
}

/**
 * Returns a formatted version of the computed total number of patients
 */
export function getPatientPretriTotal(): string {
  const textPatientCorrect = getTranslation('pretriage-interface', 'nb-patients-correct');
  const sortedId = getSortedPatientIds();
  const allHumans = getCategorizedHumans();
  let nbCorrect = 0;
  const r = sortedId
    .map(id => {
      return allHumans.find(h => h.id === id);
    })
    .flatMap(p => (p ? [p] : []));
  r.forEach(pat => {
    if (pat.categorization?.category == pat.categorization?.autoTriage.categoryId) {
      nbCorrect++;
    }
  });
  return `${nbCorrect}/${r.length} ${textPatientCorrect}`;
}
