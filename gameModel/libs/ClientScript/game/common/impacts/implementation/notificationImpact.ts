import { InterventionRole } from '../../actors/actor';
import { Uid } from '../../interfaces';
import { AddMessageLocalEvent, LocalEventBase } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface NotificationMessageImpact extends ImpactBase {
  type: 'notification';
  message: any; //TODO multilang
  sender: string; // TODO any options for scenarist ?
  roles: Record<InterventionRole, boolean>;
}

export function convertNotificationImpact(
  state: MainSimulationState,
  impact: NotificationMessageImpact,
  _parentId: Uid
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  const actors = state.getOnSiteActors().filter(act => impact.roles[act.Role]);
  return actors.map(
    a =>
      new AddMessageLocalEvent(
        0, // TODO triggerId ?
        time,
        undefined, // TODO sender id ?
        'Trigger Manager : ' + impact.sender, // TODO specific name ?
        a.Uid,
        impact.message
      )
  );
}
