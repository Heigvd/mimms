import { getActorsByLocation } from "../UIfacade/actorFacade";
import { getAvailableLocationsFacade } from "../UIfacade/locationFacade";
import { getResourcesByLocation } from "../UIfacade/resourceFacade";

export function getOverlayItems() {
	const mapEntities = getAvailableLocationsFacade();
	const overlayItems: OverlayItem[] = [];

	for (const mapEntity of mapEntities) {
		// if(mapEntity.name === 'Accreg')break;
		

		overlayItems.push({
			overlayProps: {
				position: mapEntity.getGeometricalShape().getShapeCenter(),
			},
			payload: {
				id: mapEntity.id,
				name: mapEntity.name,
				icon: mapEntity.icon,
				actors: getActorsByLocation(mapEntity.id),
				resources: getResourcesByLocation(mapEntity.id)
			}
		})
	
	}
	return overlayItems; 

}