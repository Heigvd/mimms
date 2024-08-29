import { getAvailableActions } from '../../../UIfacade/actionFacade';
import { ActionType } from '../actionType';
import { ActionTemplateBase, ActivateRadioSchemaActionTemplate } from './actionTemplateBase';

export function getRadioChannelsActivationTemplate(): ActionTemplateBase | undefined {
  const matchingActions = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.ACTIVATE_RADIO_CHANNELS
  ).filter(action => action instanceof ActivateRadioSchemaActionTemplate);

  if (matchingActions.length === 1) {
    return matchingActions[0];
  }

  return undefined;
}
