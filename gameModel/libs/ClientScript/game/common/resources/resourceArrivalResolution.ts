import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";

/**
 * Resolves which location new resources should be sent to
 * @params state
 * @returns location
 */
export default function resourceArrivalResolution(state: MainSimulationState): LOCATION_ENUM {
	const so = state.getInternalStateObject();
	
	const acsArrived = so.flags.ACS_ARRIVED;
	const mcsArrived = so.flags.MCS_ARRIVED;
	const pcBuilt = so.flags.PC_BUILT;

	if (mcsArrived && acsArrived && pcBuilt) {
		return LOCATION_ENUM.PC;
	}

	return LOCATION_ENUM.meetingPoint;
}