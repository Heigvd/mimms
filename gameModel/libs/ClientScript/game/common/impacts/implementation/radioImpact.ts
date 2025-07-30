import { Uid } from '../../interfaces';
import { AddRadioMessageLocalEvent, LocalEventBase } from '../../localEvents/localEventBase';
import { RadioType } from '../../radio/communicationType';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface RadioMessageImpact extends ImpactBase {
  type: 'radio';
  message: any; //TODO multilang
  canal: RadioType;
}

export function convertRadioNotificationImpact(
  state: MainSimulationState,
  impact: RadioMessageImpact,
  _parentId: Uid
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new AddRadioMessageLocalEvent({
      parentEventId: 0, //triggerId, // TODO convert ids to string and pass triggerId here
      simTimeStamp: time,
      senderId: 1000, // TODO senderID
      senderName: 'Event Manager sender name?', // TODO sender name
      recipientId: undefined, // recipient id
      message: impact.message,
      channel: impact.canal,
    }),
  ];
}
