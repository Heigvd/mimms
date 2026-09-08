import {
  getAvailableMapActivables,
  LOCATION_ENUM,
} from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getMapEntityDescriptor } from '../game/loaders/mapEntitiesLoader';
import { getShapeCenter } from './utils/shapeUtils';
import { locationEnumConfig } from '../game/common/mapEntities/locationEnumConfig';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { fetchLocationInfo } from '../game/common/location/locationLogic';

// Replacement based on activables/descriptors
export function computeOverlayItems(): OverlayItem[] {
  // fetch all map locations entities where there can be actors / resources / patients
  const mapActivables = getAvailableMapActivables(getCurrentState(), 'anyKind').filter(
    (a: MapEntityActivable) => {
      const accessibility = locationEnumConfig[a.binding]?.accessibility;
      return (
        a.active && a.buildStatus === 'built' && (accessibility?.Actors || accessibility?.Resources)
      );
    }
  );
  const overlayItems: OverlayItem[] = [];

  for (const mapActivable of mapActivables) {
    const mapDescriptor = getMapEntityDescriptor(mapActivable.uid);
    // by convention the overlays are placed on the first map object if any
    const firstMapObject = mapDescriptor?.mapObjects[0];

    if (firstMapObject) {
      const locationInfo = fetchLocationInfo(getCurrentState(), mapDescriptor.binding);

      overlayItems.push({
        overlayProps: {
          // Overlay centered over the first mapObject
          position: getShapeCenter(firstMapObject),
          positioning: 'bottom-center',
          offset: [0, -20],
        },
        // TODO fix OverlayTypes.d.ts typing to remove cast
        payload: locationInfo as unknown as {[index: string]: unknown}
      });
    }
  }

  const overlayState = Context.mapState.state.overlayState;

  // Sort overlayItem according to overlayState index and open/close
  overlayItems.sort((a, b) => {
    const stateA = overlayState[a.payload.id as LOCATION_ENUM];

    // Closed fixedEntities cases => after opened ones
    if (!stateA) {
      return 1;
    }
    const stateB = overlayState[b.payload.id as LOCATION_ENUM];
    if (!stateB) {
      return -1;
    }

    // higher index was brought to front more recently => comes first
    return stateB.index - stateA.index;
  });

  return overlayItems;
}
