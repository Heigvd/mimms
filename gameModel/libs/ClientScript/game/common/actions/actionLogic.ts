/**
 * All logic related to actions should live here.
 */

import { getUniqueActionTemplates } from '../../mainSimulationLogic';
import { ActionTemplateId, ActorId } from '../baseTypes';
import { RadioType } from '../radio/communicationType';
import { getOngoingActions } from '../simulationState/actionStateAccess';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActionTemplateBase } from './actionTemplateBase';

export function getSendRadioMessageTemplate(
  radioChannel: RadioType
): ActionTemplateBase | undefined {
  switch (radioChannel) {
    case RadioType.CASU:
      return getUniqueActionTemplates().CasuSendRadioMessageTemplate;
    case RadioType.ACTORS:
      return getUniqueActionTemplates().ActorSendRadioMessageTemplate;
    default:
      return undefined;
  }
}

/**
 * Has the template already been planned by another player ?
 */
export function hasBeenPlannedByOtherActor(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateId,
  actorId: ActorId
): boolean {
  return (
    getOngoingActions(state).filter(
      action => action.getTemplateId() === actionTemplateId && action.ownerId !== actorId
    ).length > 0
  );
}
