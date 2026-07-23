import { Actor, InterventionRole } from '../../actors/actor';
import { LocalEventBase, SourceType } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';
import { AddNotificationLocalEvent } from '../../localEvents/localEventBaseRadio';

/**
 * Extends the intervention roles with a dynamic value 'Initiator'
 * which is resolved at runtime to the initiator of the action that contains the impact
 */
export type DynamicInterventionRole = InterventionRole | 'Initiator';

export interface NotificationMessageImpact extends ImpactBase {
  type: 'notification';
  message: ITranslatableContent;
  roles: Record<DynamicInterventionRole, boolean>;
}

export function convertNotificationImpact(
  state: Readonly<MainSimulationState>,
  impact: NotificationMessageImpact,
  source: SourceType
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;

  const concernedActors: Set<Readonly<Actor>> = new Set<Actor>();
  // add initiator if present
  if (impact.roles['Initiator'] && source.type === 'action') {
    const action = state.getAllActions().find(action => action.Uid === source.id);
    if (action?.ownerId) {
      const actor = state.getActorById(action.ownerId);
      if (actor?.isOnSite()) {
        concernedActors.add(actor);
      }
    }
  }
  // add specific actors
  state
    .getOnSiteActors()
    .filter(act => impact.roles[act.Role])
    .forEach(act => concernedActors.add(act));

  return Array.from(
    concernedActors,
    actor =>
      new AddNotificationLocalEvent({
        parentEventId: state.getLastEventId(),
        source,
        simTimeStamp: time,
        // no sender, the sender can be written directly in the message text
        recipientId: actor.Uid,
        message: I18n.translate(impact.message),
        omitTranslation: true,
      })
  );
}
