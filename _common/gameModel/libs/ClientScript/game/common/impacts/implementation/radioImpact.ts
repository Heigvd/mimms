import { LocalEventBase, SourceType } from '../../localEvents/localEventBase';
import { RadioType } from '../../radio/communicationType';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';
import { AddRadioMessageLocalEvent } from '../../localEvents/localEventRadio';

export interface RadioMessageImpact extends ImpactBase {
  type: 'radio';
  message: ITranslatableContent;
  channel: RadioType;
}

export function convertRadioMessageImpact(
  state: Readonly<MainSimulationState>,
  impact: RadioMessageImpact,
  source: SourceType
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new AddRadioMessageLocalEvent({
      parentEventId: state.getLastEventId(),
      source,
      simTimeStamp: time,
      // no sender nor recipient, "xxx de yyy" must be written directly in the message text
      message: impact.message,
      channel: impact.channel,
    }),
  ];
}
