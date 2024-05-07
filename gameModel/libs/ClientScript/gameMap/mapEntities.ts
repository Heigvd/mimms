import { getActorsByLocation } from '../UIfacade/actorFacade';
import { getAvailableLocationsFacade } from '../UIfacade/locationFacade';
import {
  getHumanResourcesForLocation,
  getResourcesForLocationAndType,
} from '../game/common/simulationState/resourceStateAccess';
import { getCurrentState } from '../game/mainSimulationLogic';

// used in page 43
export function getOverlayItems() {
  const mapEntities = getAvailableLocationsFacade();
  const overlayItems: OverlayItem[] = [];

  for (const mapEntity of mapEntities) {
    overlayItems.push({
      overlayProps: {
        position: mapEntity.getGeometricalShape().getShapeCenter(),
        positioning: 'bottom-center',
        offset: [0, -60],
      },
      payload: {
        id: mapEntity.id,
        name: mapEntity.name,
        icon: mapEntity.icon,
        actors: getActorsByLocation(mapEntity.id),
        resources: getHumanResourcesForLocation(getCurrentState(), mapEntity.id),
        ambulances: getResourcesForLocationAndType(getCurrentState(), mapEntity.id, 'ambulance'),
        helicopters: getResourcesForLocationAndType(getCurrentState(), mapEntity.id, 'helicopter'),
      },
    });
  }
  return overlayItems;
}
