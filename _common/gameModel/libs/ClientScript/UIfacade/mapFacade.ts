/**
 * All UX interactions related to the map overlay state should live here.
 * If any signature is modified make sure to report it in all page scripts.
 * Put minimal logic in here.
 */

import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { FixedEntityContentType, getTypedMapState, MapState } from '../gameMap/main';
import { computeOverlayItems } from '../gameMap/mapEntities';
import { getTotalPatientsCountForLocation } from './patientSnapshotFacade';

export function getOverlayItems(): OverlayItem[] {
  return computeOverlayItems();
}

/**
 * Bring the given overlayItem to the front
 * Uses a timestamp so the item is guaranteed to have the highest index among open overlay items
 */
export function bringOverlayItemToFront(itemId: LOCATION_ENUM): void {
  const currentItemState = Context.mapState.state.overlayState[itemId];

  if (currentItemState) {
    const newState: MapState = Helpers.cloneDeep(Context.mapState.state);
    newState.overlayState[itemId] = { ...currentItemState, index: Date.now() };
    Context.mapState.setState(newState);
  }
}

export function isOverlayItemOpen(itemId: LOCATION_ENUM): boolean {
  return getTypedMapState()?.overlayState[itemId]?.openContent !== 'none';
}

/**
 * Open the given content panel in the fixed entity's genericFixedEntity component,
 * closing any other panel opened for it
 */
export function openFixedEntityPanel(itemId: LOCATION_ENUM, panel: FixedEntityContentType): void {
  const newState: MapState = Helpers.cloneDeep(getTypedMapState());
  const itemState = newState.overlayState[itemId];
  if (itemState) {
    itemState.openContent = panel;
    Context.mapState.setState(newState);
  }
}

/**
 * Close whichever content panel is currently opened for the given fixed map entity
 */
export function closeFixedEntityPanel(itemId: LOCATION_ENUM): void {
  const newState: MapState = Helpers.cloneDeep(getTypedMapState());
  const itemState = newState.overlayState[itemId];
  if (itemState) {
    itemState.openContent = 'none';
    Context.mapState.setState(newState);
  }
}

/**
 * @returns Whether the given content panel is currently opened for the given fixed map entity
 */
export function isFixedEntityPanelOpen(
  itemId: LOCATION_ENUM,
  panel: FixedEntityContentType
): boolean {
  return getTypedMapState()?.overlayState[itemId]?.openContent === panel;
}

/**
 * @returns Whether the given fixed map entity has nothing to show: no free resources, ambulances
 * or helicopters, and no pretriaged patients
 */
export function isFixedEntityContentEmpty(overlayItem: {
  id: LOCATION_ENUM;
  resources: unknown[];
  ambulances: unknown[];
  helicopters: unknown[];
}): boolean {
  return (
    overlayItem.resources.length < 1 &&
    overlayItem.ambulances.length < 1 &&
    overlayItem.helicopters.length < 1 &&
    getTotalPatientsCountForLocation(overlayItem.id) === 0
  );
}
