import { EvacuationSquadType, getSquadDef } from './evacuationSquadDef';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Resource } from '../resources/resource';
import * as ResourceState from '../simulationState/resourceStateAccess';

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
