/**
 * All logic related to actions should live here.
 */

import { compareByIndex } from '../../../tools/indexedSorting';
import { isChoiceTemplate } from '../../../UIfacade/actionFacade';
import { getUniqueActionTemplates } from '../../mainSimulationLogic';
import { ActionTemplateUid, ActorId } from '../baseTypes';
import { RadioType } from '../radio/communicationType';
import { getOngoingActions, isChoiceAvailable } from '../simulationState/actionStateAccess';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActionTemplateBase, ChoiceTemplate } from './actionTemplateBase';
import { ChoiceDescriptor } from './choiceDescriptor/choiceDescriptor';

// directly used by radioMessageInput page
export function getSendRadioMessageTemplate(
  radioChannel: RadioType
): ActionTemplateBase | undefined {
  switch (radioChannel) {
    case RadioType.CASU:
      return getUniqueActionTemplates()?.CasuSendRadioMessageTemplate;
    case RadioType.ACTORS:
      return getUniqueActionTemplates()?.ActorSendRadioMessageTemplate;
    default:
      return undefined;
  }
}

/**
 * Has the template already been planned by another player ?
 */
export function hasBeenPlannedByOtherActor(
  state: Readonly<MainSimulationState>,
  actionTemplateId: ActionTemplateUid,
  actorId: ActorId
): boolean {
  return (
    getOngoingActions(state).filter(
      action => action.getTemplateId() === actionTemplateId && action.ownerId !== actorId
    ).length > 0
  );
}

export function getAvailableChoices(
  state: Readonly<MainSimulationState>,
  template: Readonly<ChoiceTemplate>
): ChoiceDescriptor[] {
  if (isChoiceTemplate(template)) {
    return template.choices.filter(choice => isChoiceAvailable(state, choice)).sort(compareByIndex);
  }

  return [];
}
