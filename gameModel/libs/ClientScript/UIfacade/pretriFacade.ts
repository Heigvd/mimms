import { toHoursMinutesSecondsIso } from '../tools/helper';
import { getTranslation } from '../tools/translation';

/**
 * Returns the latest stored pretri time in drill games
 */
export function getFormattedPretriTime(): string {
  const t = Variable.find(gameModel, 'latest_pretri_time').getValue(self);
  const time = toHoursMinutesSecondsIso(t);
  const timeLabel = getTranslation('pretriage-interface', 'time');
  return `${timeLabel} ${time}`;
}
