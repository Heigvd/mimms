import { InterventionRole } from '../../actors/actor';
import { Uid } from '../../interfaces';
import { AddMessageLocalEvent, LocalEventBase } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface NotificationMessageImpact extends ImpactBase {
  type: 'notification';
  message: any; //TODO multilang
  sender: any; // TODO what options for scenarist ?
  role: InterventionRole; // TODO
}

export function convertNotificationImpact(
  state: MainSimulationState,
  impact: NotificationMessageImpact,
  parentId: Uid
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  const actors = state.getOnSiteActors().filter(a => a.Role === impact.role);
  return actors.map(
    a =>
      new AddMessageLocalEvent(
        0, //triggerId, // TODO convert ids to string and pass triggerId here
        time,
        impact.sender, // TODO sender id
        'Trigger Manager', // TODO specific name
        a.Uid,
        impact.message
      )
  );
}
