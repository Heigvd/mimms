/**
 * All logic related to actions should live here.
 */

import { fetchActionTemplate } from '../../mainSimulationLogic';
import { RadioType } from '../actionType';
import { ActionTemplateBase } from './actionTemplateBase';

export function getSendRadioMessageTemplate(
  radioChannel: RadioType
): ActionTemplateBase | undefined {
  return fetchActionTemplate('SendRadioMessageTemplate_' + radioChannel);
}
