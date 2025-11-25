import { Uid } from '../../game/common/interfaces';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { patchX } from '../../tools/helper';
import { getMapEntityController } from '../controllers/controllerInstances';
import { MapEntityFlatType } from '../controllers/dataController';
import { FlatMapEntity } from '../typeDefinitions/mapEntityDefinition';
import { getItems } from '../UIfacade/genericConfigFacade';
import { GenericScenaristInterfaceState } from './genericConfigFacade';

export function getFilteredLocations(): FlatMapEntity[] {
  const location = getMapEntityController().getLatestIState().selectedFilter;

  return getItems('mapEntity')
    .filter(item => item.superType === 'mapEntity')
    .map(trigger => trigger as FlatMapEntity)
    .filter(item => location === item.binding);
}

export function updateItem<T extends MapEntityFlatType>(uid: Uid, newData: Partial<T>): void {
  const controller = getMapEntityController();
  const data: Record<Uid, MapEntityFlatType> = controller.getFlatDataClone();
  if (data[uid] != undefined) {
    data[uid] = patchX(data[uid], newData)!;
    controller.updateData(data);
  }
}

export function setLocationFilter(location: LOCATION_ENUM): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.selectedFilter = location;
  getMapEntityController().updateIState(newState);
}

// on prend le lieu représenté par le bouton actuel en argument
// on le compare avec le lieu représenté par le filtre sélectionné dans le dernier état de l'UI
// on return true si les deux lieux sont identiques (donc si le bouton est le filtre actif)
export function isActiveLocation(location: LOCATION_ENUM): boolean {
  const state = getMapEntityController().getLatestIState();
  return state.selectedFilter === location;
}

// Interface state
type LocationModalState = 'opened' | 'closed';

export function getLocationModalState(): LocationModalState {
  return getMapEntityController().getLatestIState().modal;
}

export function setLocationModalState(state: LocationModalState): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.modal = state;
  getMapEntityController().updateIState(newState);
}

export function shouldHideLocationModal(): boolean {
  return getLocationModalState() !== 'opened';
}

// Shrink Locations list pannel
export interface MapEntityUIState extends GenericScenaristInterfaceState {
  selectedFilter: LOCATION_ENUM;
  modal: LocationModalState;
  pannel: boolean;
}

export function getInitialMapEntityUIState(): MapEntityUIState {
  return {
    selectedFilter: LOCATION_ENUM.chantier,
    selected: {},
    modal: 'closed',
    pannel: true,
  };
}

export function getLocationUIState(): MapEntityUIState {
  return getMapEntityController().getLatestIState();
}

export function toggleLocationPannel() {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.pannel = !newState.pannel;
  getMapEntityController().updateIState(newState);
}

export function getLocationPannel() {
  return getLocationUIState().pannel;
}
