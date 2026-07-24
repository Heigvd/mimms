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
  return `<span class="text-stat">${time}</span><br>${timeLabel}`;
}

export function actionsBlocked(): boolean {
  return getDrillStatus() !== 'ongoing' && Variable.find(gameModel, 'examMode').getValue(self);
}

/**
 * Returns a formatted version of the computed total number of patients
 */
export function getPatientPretriTotal(): string {
  const textPatientCorrect = getTranslation('pretriage-interface', 'nb-patients-correct');
  const textSuccessPourcentage = getTranslation('pretriage-interface', 'success');
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
  const percentage = r.length > 0 ? Math.round((nbCorrect / r.length) * 100) : 0;
  return `<span class="text-stat">${percentage}% ${textSuccessPourcentage}</span><br>${nbCorrect}/${r.length} ${textPatientCorrect}`;
}
