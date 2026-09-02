/**
 * All UX interactions related to the map overlay state should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getTypedMapState, MapState } from '../gameMap/main';


export function shouldShowPatientDetails(location: LOCATION_ENUM): boolean {
  return !!getTypedMapState()?.overlayState[location]?.showPatientDetails;
}

export function shouldShowRessourceDetails(location: LOCATION_ENUM): boolean {
  return !!getTypedMapState()?.overlayState[location]?.showRessourceDetails;
}

export function setShowPatientDetails(location: LOCATION_ENUM, show: boolean): void {
  const newState: MapState = Helpers.cloneDeep(getTypedMapState());
  const itemState = newState.overlayState[location];
  if (itemState) {
    itemState.showPatientDetails = show;
    Context.mapState.setState(newState);
  }
}

export function setShowRessourceDetails(location: LOCATION_ENUM, show: boolean): void {
  const newState: MapState = Helpers.cloneDeep(getTypedMapState());
  const itemState = newState.overlayState[location];
  if (itemState) {
    itemState.showRessourceDetails = show;
    Context.mapState.setState(newState);
  }
}
