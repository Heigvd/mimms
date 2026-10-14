import {
  getAvailableMapActivables,
  LOCATION_ENUM,
} from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getMapEntityDescriptor } from '../game/loaders/mapEntitiesLoader';
import { getShapeCenter } from './utils/shapeUtils';
import { locationEnumConfig } from '../game/common/mapEntities/locationEnumConfig';
import { MapEntityActivable } from '../game/common/simulationState/activableState';
import { fetchLocationInfo, LocationInfo } from '../game/common/location/locationLogic';
import { MainSimulationState } from '../game/common/simulationState/mainSimulationState';
import { SimFlag } from '../game/common/actions/actionTemplate/actionTemplateBase';

// Replacement based on activables/descriptors
export function computeOverlayItems(): OverlayItem[] {
  // fetch all map locations entities where there can be actors / resources / patients
  const mapActivables = getAvailableMapActivables(getCurrentState(), 'AnyKind').filter(
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
      const locationInfo = hideALBeforePCFront(
        getCurrentState(),
        fetchLocationInfo(getCurrentState(), mapDescriptor.binding)
      );

      overlayItems.push({
        overlayProps: {
          // Overlay centered over the first mapObject
          position: getShapeCenter(firstMapObject),
          positioning: 'bottom-center',
          offset: [0, -25],
        },
        // TODO fix OverlayTypes.d.ts typing to remove cast
        payload: locationInfo as unknown as { [index: string]: unknown },
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

/**
 * The AL and its initial resource are only shown on the map once the PC Front has been placed
 * (until then they are logically at the entreeChantier, but are not displayed)
 */
function hideALBeforePCFront(
  state: Readonly<MainSimulationState>,
  locationInfo: LocationInfo | undefined
): LocationInfo | undefined {
  if (!locationInfo || state.isSimFlagEnabled(SimFlag.PCFRONT_BUILT)) {
    return locationInfo;
  }

  // same convention as PCFrontChoiceAction : the first resource is the one coming with the AL
  const initialResourceUid = state.getInternalStateObject().resources[0]?.Uid;

  return {
    ...locationInfo,
    actors: locationInfo.actors.filter(actor => actor.Role !== 'AL'),
    resources: locationInfo.resources.filter(resource => resource.Uid !== initialResourceUid),
  };
}
