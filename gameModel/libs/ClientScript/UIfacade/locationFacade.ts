import { FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { getAvailableMapLocations } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getTranslation } from '../tools/translation';
import { getActor } from './actorFacade';

// used in page 66
export function getActorMapLocationChoices(): { label: string; value: string }[] {
  const currentActor = getActor(Context.interfaceState.state.currentActorUid);

  const locations = getAvailableMapLocations(getCurrentState(), 'Actors')
    /* filter out the current location */
    .filter(fixedEntity => fixedEntity.id != currentActor!.Location);

  return getLocationChoicesData(locations);
}

// used in page 67
export function getResourceMapLocationChoices(): { label: string; value: string }[] {
  const locations = getAvailableMapLocations(getCurrentState(), 'Resources');
  return getLocationChoicesData(locations);
}

function getLocationChoicesData(
  mapLocations: FixedMapEntity[]
): { label: string; value: string }[] {
  return mapLocations.map(fixedEntity => {
    return { label: getTranslation('mainSim-locations', fixedEntity.name), value: fixedEntity.id };
  });
}
