import { EvacuationSquadType, getSquadDef } from './evacuationSquadDef';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Resource } from '../resources/resource';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getCachedHospitalById, getCachedHospitalsByProximity } from '../../loaders/hospitalLoader';
import { HospitalId } from '../baseTypes';
import { OneMinuteDuration } from '../constants';
import { HospitalDefinition } from './hospitalType';

export function isEvacSquadAvailable(
  state: Readonly<MainSimulationState>,
  type: EvacuationSquadType
): boolean {
  const neededResources = getSquadDef(type).neededResources;

  const matchingResources = getResourcesForEvacSquad(state, type);

  return matchingResources.length === neededResources.length;
}

export function getResourcesForEvacSquad(
  state: Readonly<MainSimulationState>,
  type: EvacuationSquadType
): Resource[] {
  const squadDef = getSquadDef(type);
  const location = squadDef.location;

  const availableResourcesAtLocation = ResourceState.getFreeWaitingResourcesByLocation(
    state,
    location
  );

  const result: Resource[] = [];

  // For each needed resource
  for (const wantedResource of squadDef.neededResources) {
    // we try to get one of the favorite type.
    // If not available, we try to get a resource matching the second type, ... and so on
    for (const possibleType of wantedResource.qualifiedTypes) {
      const matchingResource = availableResourcesAtLocation.find(
        resource => resource.type === possibleType
      );
      if (matchingResource !== undefined) {
        result.push(matchingResource);
        // remove from the available resources at location
        availableResourcesAtLocation.splice(
          availableResourcesAtLocation.indexOf(matchingResource),
          1
        );
        break;
      }
    }
  }

  return result;
}

// -------------------------------------------------------------------------------------------------
// Travel time to hospital
// -------------------------------------------------------------------------------------------------

/**
 * @param hospitalId the hospital
 * @param squadType the squad that go to the hospital
 *
 * @return The number of seconds needed to go to the hospital
 */
export function computeTravelTime(hospitalId: HospitalId, squadType: EvacuationSquadType): number {
  const squad = getSquadDef(squadType);
  const distance = getCachedHospitalById(hospitalId).distance ?? 0;

  return Math.ceil(
    (squad.loadingTime + (distance / squad.speed) * 60 + squad.unloadingTime) * OneMinuteDuration
  );
}

// Could be used by evacuationFacade.getEvacHospitalsChoices()
export function getHospitalsMentionedByCasu(
  state: Readonly<MainSimulationState>
): Record<HospitalId, HospitalDefinition> {
  const proximityRequested = state.getInternalStateObject().hospital.proximityWidestRequest;
  if (proximityRequested !== undefined) {
    return getCachedHospitalsByProximity(proximityRequested);
  }

  return {};
}
