/**
 * All logic related to actions should live here.
 */

import { getUniqueActionTemplates } from '../../mainSimulationLogic';
import { ActionType, RadioType } from '../actionType';
import { ActionTemplateBase } from './actionTemplateBase';

export function getSendRadioMessageTemplate(
  radioChannel: RadioType
): ActionTemplateBase | undefined {
  switch (radioChannel) {
    case ActionType.CASU_RADIO:
      return getUniqueActionTemplates().CasuSendRadioMessageTemplate;
    case ActionType.ACTORS_RADIO:
      return getUniqueActionTemplates().ActorSendRadioMessageTemplate;
    default:
      return undefined;
  }
}
