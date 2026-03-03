import { SimFlag } from '../game/common/actions/actionTemplateBase';
import { getCurrentState } from '../game/mainSimulationLogic';

/**
 * Have the ACS and MCS taken function ?
 * @returns boolean
 */
export function areAcsMcsAnnounced(): boolean {
  return getCurrentState().isSimFlagEnabled(SimFlag.ACS_MCS_ANNOUNCED);
}

export function isRadioSchemaActivated(): boolean {
  return getCurrentState().isSimFlagEnabled(SimFlag.RADIO_SCHEMA_ACTIVATED);
}
