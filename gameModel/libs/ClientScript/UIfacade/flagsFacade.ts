import { SimFlag } from "../game/common/actions/actionTemplateBase";
import { getCurrentState } from "../game/mainSimulationLogic";

/**
 * Check if acs and mcs annouced themselves 
 */
export function areAcsMcsAnnouced() {
	return getCurrentState().isSimFlagEnabled(SimFlag.ACSMCS_ANNOUCED);
}