import { SimFlag } from "../game/common/actions/actionTemplateBase";
import { getCurrentState } from "../game/mainSimulationLogic";

/**
 * Have the ACS and MCS taken function ?
 * @returns boolean 
 */
export function areAcsMcsAnnouced(): boolean {
	return getCurrentState().isSimFlagEnabled(SimFlag.ACS_MCS_ANNOUCED);
}