import { getActorsByLocation } from '../UIfacade/actorFacade';
import { getAvailableLocationsFacade } from '../UIfacade/locationFacade';
import { getHumanResourcesByLocation } from '../UIfacade/resourceFacade';

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
        resources: getHumanResourcesByLocation(mapEntity.id),
      },
    });
  }
  return overlayItems;
}
