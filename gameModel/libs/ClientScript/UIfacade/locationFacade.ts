import { getAvailableMapActivables } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTranslation } from '../tools/translation';
import { getSelectedActorLocation } from './actorFacade';
import { ActorId } from '../game/common/baseTypes';
import * as TaskFacade from './taskFacade';
import { getTypedInterfaceState } from '../gameInterface/interfaceState';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { getMapEntityDescriptor } from '../game/loaders/mapEntitiesLoader';

// used in page 66
export function getActorTargetLocationChoices(): { label: string; value: string }[] {
  const actorLocation = getSelectedActorLocation();

  const locations: MapEntityActivable[] = getAvailableMapActivables(getCurrentState(), 'Actors')
    /* filter out the current location */
    .filter((mapActivable: MapEntityActivable) => mapActivable.binding != actorLocation);

  return getLocationChoicesData(locations);
}

// used in page 67
export function getResourceSourceLocationChoices(): { label: string; value: string }[] {
  const currentActorId = getTypedInterfaceState().currentActorUid;
  if (currentActorId) {
    const locations: MapEntityActivable[] = getAvailableMapActivables(
      getCurrentState(),
      'Resources'
    ).filter(
      // Check that there is at least one task that can be selected
      (mapActivable: MapEntityActivable) =>
        TaskFacade.getResourceManagementSourceTaskChoices(currentActorId, mapActivable.binding)
          .length > 0
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
  const locations = getAvailableMapActivables(getCurrentState(), 'Resources').filter(
    (mapActivable: MapEntityActivable) =>
      // Check that there is at least one task that can be selected
      TaskFacade.getResourceManagementTargetTaskChoices(actorId, mapActivable.binding).length > 0
  );
  return getLocationChoicesData(locations);
}

function getLocationChoicesData(
  mapLocations: MapEntityActivable[]
): { label: string; value: string }[] {
  return mapLocations.map((mapActivable: MapEntityActivable) => {
    const descriptor = getMapEntityDescriptor(mapActivable.uid)!;
    return {
      label: getTranslation('mainSim-locations', descriptor?.mapObjects[0]?.label || ''),
      value: mapActivable.binding,
    };
  });
}
