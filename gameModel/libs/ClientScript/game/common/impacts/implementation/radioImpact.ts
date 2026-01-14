import { ActorId } from '../../baseTypes';
import { Uid } from '../../interfaces';
import { AddRadioMessageLocalEvent, LocalEventBase } from '../../localEvents/localEventBase';
import { RadioType } from '../../radio/communicationType';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface RadioMessageImpact extends ImpactBase {
  type: 'radio';
  message: ITranslatableContent;
  channel: RadioType;
}

export function convertRadioMessageImpact(
  state: Readonly<MainSimulationState>,
  impact: RadioMessageImpact,
  sourceId: Uid | ActorId
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new AddRadioMessageLocalEvent({
      parentEventId: state.getLastEventId(),
      sourceId: String(sourceId),
      simTimeStamp: time,
      // no sender nor recipient, "xxx de yyy" must be written directly in the message text
      message: I18n.translate(impact.message),
      channel: impact.channel,
      omitTranslation: true,
    }),
  ];
}
