import { getAvailableActions } from '../../../UIfacade/actionFacade';
import { ActionType, RadioType } from '../actionType';
import {
  ActionTemplateBase,
  ActivateRadioSchemaActionTemplate,
  SendRadioMessageTemplate,
} from './actionTemplateBase';

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

// TODO : make it independant from ActionType
export function getSendRadioMessageTemplate(
  actionType: ActionType,
  radioChannel: RadioType
): ActionTemplateBase | undefined {
  const matchingActions = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    actionType
  ).filter(
    action => action instanceof SendRadioMessageTemplate && action.radioChannel === radioChannel
  );

  if (matchingActions.length === 1) {
    return matchingActions[0];
  }

  return undefined;
}
