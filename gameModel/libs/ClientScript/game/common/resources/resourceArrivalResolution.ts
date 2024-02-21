import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";

/**
 * Resolves which location new resources should be sent to
 * @params state
 * @returns location
 */
export default function resourceArrivalResolution(state: MainSimulationState): LOCATION_ENUM {
	const so = state.getInternalStateObject();
	// TODO Replace with new flags from MIM-95
	const mcsArrived = so.actors.find(a => a.Role === 'MCS');
	// TODO Replace with new flags from MIM-95
	const acsArrived = so.actors.find(a => a.Role === 'ACS');
	// TODO Replace with new flags from MIM-95
	const pcBuilt = so.mapLocations.find(l => l.id === LOCATION_ENUM.PC);

	if (mcsArrived && acsArrived && pcBuilt) {
		return LOCATION_ENUM.PC;
	}

	return LOCATION_ENUM.meetingPoint;
}