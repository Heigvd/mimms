import { FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { getAvailableMapLocations } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTranslation } from '../tools/translation';
import { getSelectedActorLocation } from './actorFacade';
import { ActorId } from '../game/common/baseTypes';
import * as TaskFacade from './taskFacade';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';

// used in page 66
export function getActorTargetLocationChoices(): { label: string; value: string }[] {
  const actorLocation = getSelectedActorLocation();

  // Todo replace with getAvailableMapActivables()
  const locations: FixedMapEntity[] = getAvailableMapLocations(getCurrentState(), 'Actors')
    /* filter out the current location */
    .filter((fixedEntity: FixedMapEntity) => fixedEntity.id != actorLocation);

  return getLocationChoicesData(locations);
}

// used in page 67
export function getResourceSourceLocationChoices(): { label: string; value: string }[] {
  const currentActorId = getTypedInterfaceState().currentActorUid;
  if (currentActorId) {
    // Todo replace with getAvailableMapActivables()
    const locations: FixedMapEntity[] = getAvailableMapLocations(
      getCurrentState(),
      'Resources'
    ).filter(
      // Check that there is at least one task that can be selected
      (mapEntity: FixedMapEntity) =>
        TaskFacade.getResourceManagementSourceTaskChoices(currentActorId, mapEntity.id).length > 0
    );
    return getLocationChoicesData(locations);
  } else {
    // if no selected actor, no choice
    return [];
  }
}

// used in page 67
export function getResourceTargetLocationChoices(
  actorId: ActorId
): { label: string; value: string }[] {
  // Todo replace with getAvailableMapActivables()
  const locations = getAvailableMapLocations(getCurrentState(), 'Resources').filter(
    (mapEntity: FixedMapEntity) =>
      // Check that there is at least one task that can be selected
      TaskFacade.getResourceManagementTargetTaskChoices(actorId, mapEntity.id).length > 0
  );
  return getLocationChoicesData(locations);
}

function getLocationChoicesData(
  mapLocations: FixedMapEntity[]
): { label: string; value: string }[] {
  return mapLocations.map((fixedEntity: FixedMapEntity) => {
    return { label: getTranslation('mainSim-locations', fixedEntity.name), value: fixedEntity.id };
  });
}
