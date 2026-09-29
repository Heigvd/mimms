import { EvacuationSquadDefinition, EvacuationSquadType, getSquadDef, getTotalResourcesNeeded } from './evacuationSquadDef';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Resource } from '../resources/resource';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getCachedHospitalById, getCachedHospitalsByProximity } from '../../loaders/hospitalLoader';
import { HospitalId, ResourceId } from '../baseTypes';
import { OneMinuteDuration } from '../constants';
import { HospitalDefinition } from './hospitalType';
import { evacuationLogger } from '../../../tools/logger';
import { getCurrentState } from '../../mainSimulationLogic';
import { isHuman, HumanResourceType } from '../resources/resourceType';

export function isEvacSquadAvailable(
  state: Readonly<MainSimulationState>,
  type: EvacuationSquadType
): boolean {
  const matchingResources = getResourcesForEvacSquad(state, type);
  return matchingResources.length === getTotalResourcesNeeded(type);
}

export function getResourcesForEvacSquad(
  state: Readonly<MainSimulationState>,
  type: EvacuationSquadType
): Resource[] {
  const squadDef = getSquadDef(type);
  const location = squadDef.location;

  const availableResourcesAtLocation = ResourceState.getWaitingResourcesByLocation(state, location);

  const result: Resource[] = [];

  // For each needed resource
  const allRequirements = Object.values(squadDef.resourcesTypesRequirements).flat(1);
  for (const wantedResource of allRequirements) {
    // we try to get one of the favorite type.
    // If not available, we try to get a resource matching the second type, ... and so on
    for (const possibleType of wantedResource) {
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


/**
 * Forms squads given the resources at some location and a squad type
 * one squad per vehicle and then select drivers then healers
 * Quick implementation that works for 1 or 2 human resource skills only
 * over 2 hr the number of formed squads might be suboptimal
 * @param squadType
 * @returns
 */
export function buildAvailableSquads(squadType: EvacuationSquadType): EvacuationSquad[] {
  const state = getCurrentState();
  const squadDef = getSquadDef(squadType);
  const location = squadDef.location;
  const vehicles = squadDef.resourcesTypesRequirements.vehicleTypes
    .map(type => ResourceState.getResourcesByTypeAndLocation(state, type, location))
    .flat(1);

  const humanResources = ResourceState.getWaitingResourcesByLocation(state, location);

  const list: EvacuationSquad[] = [];
  const requirements = squadDef.resourcesTypesRequirements;
  // driver skills then healer skills
  const skills = requirements.driverTypes.concat(requirements.healerTypes);

  const skill1: Resource[] = [];
  const skill2: Resource[] = [];
  const skillBoth: Resource[] = [];

  if (skills.length === 2) {
    humanResources.forEach(hr => {
      const t = hr.type;
      if (isHuman(t)) {
        if (skills[0]!.includes(t) && skills[1]!.includes(t)) {
          skillBoth.push(hr);
        } else if (skills[0]!.includes(t)) {
          skill1.push(hr);
        } else if (skills[1]!.includes(t)) {
          skill2.push(hr);
        }
      }
    });
    // distribute evenly those who can do both
    skillBoth.forEach((r: Resource) => {
      if (skill1.length < skill2.length) {
        skill1.push(r);
      } else {
        skill2.push(r);
      }
    });
  } else {
    if (skills.length > 2) {
      evacuationLogger.warn(
        'No algorithm to optimize squad creation, the number of squads might be suboptimal'
      );
    }
  }

  vehicles.forEach(v => {
    const squad: EvacuationSquad = {
      type: squadType,
      vehicle: v,
      squadId: v.Uid,
      drivers: [],
      healers: [],
    };

    if (skills.length === 2) {
      const skillGroups = [skill1, skill2];
      let skillIdx = 0;
      // fill drivers if any
      for (let i = 0; i < squadDef.resourcesTypesRequirements.driverTypes.length; i++) {
        const group = skillGroups[skillIdx];
        if (group && group.length > 0) {
          const r = group.pop();
          if (r) squad.drivers.push(r);
        }
        skillIdx++;
      }

      // fill healers if any
      for (let i = 0; i < squadDef.resourcesTypesRequirements.healerTypes.length; i++) {
        const group = skillGroups[skillIdx];
        if (group && group.length > 0) {
          const r = group.pop();
          if (r) squad.healers.push(r);
        }
        skillIdx++;
      }
    } else {
      naiveSquadFill(squadDef, humanResources, squad);
    }

    list.push(squad);
  });

  return list;
}


export interface EvacuationSquad {
  /**
   * By convention the id is the vehicle resource id
   */
  squadId: ResourceId;
  type: EvacuationSquadType;
  vehicle: Resource;
  drivers: Resource[];
  healers: Resource[];
}
/**
 * naively takes resources in the pool of resources
 * @param def
 * @param hrs resource pool
 * @param squad currently build squad
 */
function naiveSquadFill(
  def: EvacuationSquadDefinition,
  hrs: Resource[],
  squad: EvacuationSquad
): void {
  // fill drivers if any
  def.resourcesTypesRequirements.driverTypes.forEach((allowed: HumanResourceType[]) => {
    const idx = hrs.findIndex(r => isHuman(r.type) && allowed.includes(r.type));
    if (idx > -1) {
      const r = hrs.splice(idx, 1)[0]!;
      squad.drivers.push(r);
    }
  });

  // fill healers if any
  def.resourcesTypesRequirements.healerTypes.forEach((allowed: HumanResourceType[]) => {
    const idx = hrs.findIndex(r => isHuman(r.type) && allowed.includes(r.type));
    if (idx > -1) {
      const r = hrs.splice(idx, 1)[0]!;
      squad.healers.push(r);
    }
  });
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
