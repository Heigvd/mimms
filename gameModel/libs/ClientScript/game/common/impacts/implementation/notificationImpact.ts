import { InterventionRole } from '../../actors/actor';
import { Uid } from '../../interfaces';
import { AddNotificationLocalEvent, LocalEventBase } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface NotificationMessageImpact extends ImpactBase {
  type: 'notification';
  message: ITranslatableContent;
  roles: Record<InterventionRole, boolean>;
}

export function convertNotificationImpact(
  state: Readonly<MainSimulationState>,
  impact: NotificationMessageImpact,
  parentTriggerId: Uid
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  const concernedActors = state.getOnSiteActors().filter(act => impact.roles[act.Role]);
  return concernedActors.map(
    actor =>
      new AddNotificationLocalEvent({
        parentEventId: state.getLastEventId(),
        parentTriggerId,
        simTimeStamp: time,
        // no sender, the sender can be written directly in the message text
        recipientId: actor.Uid,
        message: I18n.translate(impact.message),
        omitTranslation: true,
      })
  );
}
