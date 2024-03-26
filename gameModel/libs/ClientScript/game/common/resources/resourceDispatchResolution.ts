import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { hierarchyLevels } from "../actors/actor";
import { ActorId } from "../baseTypes";
import { HumanResourceTypeArray, ResourceType } from './resourceType';

/**
 * Resolves which location new resources should be sent to
 * @params state
 * @returns location
 */
export default function resourceArrivalResolution(
  state: MainSimulationState,
  resourceType: ResourceType
): LOCATION_ENUM {
  const so = state.getInternalStateObject();

  if (Object.values(HumanResourceTypeArray).some(type => type === resourceType)) {
    const acsArrived = so.flags.ACS_ARRIVED;
    const mcsArrived = so.flags.MCS_ARRIVED;
    const pcBuilt = so.flags.PC_BUILT;

    if (mcsArrived && acsArrived && pcBuilt) {
      return LOCATION_ENUM.PC;
    }
  }

  if (resourceType === 'ambulance' && so.flags.AMBULANCE_PARK_BUILT) {
    return LOCATION_ENUM.ambulancePark;
  }

  if (resourceType === 'helicopter' && so.flags.HELICOPTER_PARK_BUILT) {
    return LOCATION_ENUM.helicopterPark;
  }

  return LOCATION_ENUM.meetingPoint;
}

/**
 * Resolve whether a resource should obey move and task order
 * @param actorUid Actor emitting the order
 * @param sourceLocation Current location of the resource
 * @param state
 * @returns boolean 
 */
export function doesOrderRespectHierarchy(actorUid: ActorId, sourceLocation: LOCATION_ENUM, state: Readonly<MainSimulationState>): boolean {
	const actor = state.getActorById(actorUid)!;
	const locationLeaderRoles = state.getMapLocations().find(l => l.id === sourceLocation)!.leaderRoles;

	if (locationLeaderRoles.length === 0) {
		return true;
	} else {
		
		// Returns lowest role available
		const minLeaderRole = locationLeaderRoles.reduce((minRole, currRole) => {
			return hierarchyLevels[currRole] < hierarchyLevels[minRole] ? currRole : minRole;
		}, locationLeaderRoles[0]);

		return hierarchyLevels[actor.Role] <= hierarchyLevels[minLeaderRole];
	}
}