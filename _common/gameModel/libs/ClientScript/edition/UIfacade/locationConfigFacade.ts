import { Uid } from '../../game/common/interfaces';
import { locationEnumConfig } from '../../game/common/mapEntities/locationEnumConfig';
import { LineExtremity } from '../../game/common/mapEntities/mapEntityDescriptor';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { patchX } from '../../tools/helper';
import { getLocationTranslation } from '../../UIfacade/locationFacade';
import { getMapEntityController } from '../controllers/controllerInstances';
import { MapEntityCreationOptions, MapEntityFlatType } from '../controllers/dataController';
import { FlatMapEntity } from '../typeDefinitions/mapEntityDefinition';
import { FlatMapObject } from '../typeDefinitions/mapObjectDefinition';
import { addNew, getItems, ModalState } from './genericConfigFacade';
import { GenericScenaristInterfaceState } from './genericConfigFacade';

export type SupportedDrawType = Exclude<DrawType, 'Circle'>;

export interface MapEntityUIState extends GenericScenaristInterfaceState {
  selectedFilter: LOCATION_ENUM;
  modal: ModalState;
  panel: boolean;
  onlySelected: boolean;
  drawActive: boolean;
  drawType: SupportedDrawType;
}

export function getFilteredLocations(): FlatMapEntity[] {
  const location = getMapEntityController().getLatestIState().selectedFilter;

  return getItems('mapEntity')
    .filter(item => item.superType === 'mapEntity')
    .map(trigger => trigger as FlatMapEntity)
    .filter(item => location === item.binding);
}

export function createNewMapEntity(): void {
  const options: MapEntityCreationOptions = {
    location: getMapEntityController().getLatestIState().selectedFilter,
  };
  addNew('mapEntity', undefined, options);
}

export function updateItem<T extends MapEntityFlatType>(uid: Uid, newData: Partial<T>): void {
  const controller = getMapEntityController();
  const data: Record<Uid, MapEntityFlatType> = controller.getFlatDataClone();
  if (data[uid] != undefined) {
    data[uid] = patchX(data[uid], newData)!;
    controller.updateData(data);
  }
}

export function canInsertMapEntity(): boolean {
  const state = getMapEntityController().getLatestIState();
  return state.selectedFilter !== LOCATION_ENUM.chantier;
}

export function setLocationFilter(location: LOCATION_ENUM): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.selectedFilter = location;
  getMapEntityController().updateIState(newState);
}

export function isCustomLocation(item: FlatMapEntity): boolean {
  return item.binding === LOCATION_ENUM.custom;
}

// on prend le lieu représenté par le bouton actuel en argument
// on le compare avec le lieu représenté par le filtre sélectionné dans le dernier état de l'UI
// on return true si les deux lieux sont identiques (donc si le bouton est le filtre actif)
export function isActiveLocation(location: LOCATION_ENUM): boolean {
  const state = getMapEntityController().getLatestIState();
  return state.selectedFilter === location;
}

export function currentLocation(): string {
  const state = getMapEntityController().getLatestIState();
  return state.selectedFilter.toString();
}

// Interface state

export function getLocationModalState(): ModalState {
  return getMapEntityController().getLatestIState().modal;
}

export function setLocationModalState(state: ModalState): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.modal = state;
  getMapEntityController().updateIState(newState);
}

export function shouldHideLocationModal(): boolean {
  return getLocationModalState() !== 'opened';
}

export function getLocationUIState(): MapEntityUIState {
  return getMapEntityController().getLatestIState();
}

// Shrink Locations list panel
export function toggleLocationPanel() {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.panel = !newState.panel;
  getMapEntityController().updateIState(newState);
}

export function getLocationPanel() {
  return getLocationUIState().panel;
}

// Hide/show button
export function showOnlySelected(): boolean {
  return getMapEntityController().getLatestIState().onlySelected;
}

export function toggleOtherCategories(): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.onlySelected = !newState.onlySelected;
  getMapEntityController().updateIState(newState);
}

export function updateOffsetX(value: number, target: FlatMapObject): void {
  const offsetY = target?.labelOffset?.length == 2 ? target.labelOffset[1] : 0;
  const newOffset: [number, number] = [value, offsetY];
  updateItem<FlatMapObject>(target.uid, { labelOffset: newOffset });
}

export function updateOffsetY(value: number, target: FlatMapObject): void {
  const offsetX = target?.labelOffset?.length == 2 ? target.labelOffset[0] : 0;
  const newOffset: [number, number] = [offsetX, value];
  updateItem<FlatMapObject>(target.uid, { labelOffset: newOffset });
}

export function updateLineExtremities(
  target: FlatMapObject,
  lineStart: LineExtremity,
  lineEnd: LineExtremity
): void {
  updateItem<FlatMapObject>(target.uid, { lineStart, lineEnd });
}

export function areCurrentLineExtremitiesSelected(
  currentStart: LineExtremity,
  currentEnd: LineExtremity,
  selectedStart: LineExtremity,
  selectedEnd: LineExtremity
): boolean {
  return currentStart === selectedStart && currentEnd === selectedEnd;
}

export function getFilters(): { label: string; binding: LOCATION_ENUM }[] {
  return Object.values(locationEnumConfig)
    .filter(loc => loc.id !== LOCATION_ENUM.remote)
    .map(loc => ({ label: getLocationTranslation(loc.id), binding: loc.id }));
}

// **************** MAP REFRESH *************

export function notifyLayerChange(): void {
  if (mapObjectsLayerRef?.current?.changed) {
    mapObjectsLayerRef.current.changed();
  }
}

export function notifyModalLayerChange(): void {
  if (mapObjectsLayerModalRef?.current?.changed) {
    mapObjectsLayerModalRef.current.changed();
  }
}

export const mapObjectsLayerRef = Helpers.useRef<any>('mapObjectsLayerRef', null);
export const mapObjectsLayerModalRef = Helpers.useRef<any>('mapObjectsLayerModalRef', null);
