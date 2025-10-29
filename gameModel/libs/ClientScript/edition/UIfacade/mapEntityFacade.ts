import { GenericScenaristInterfaceState } from './genericConfigFacade';

export interface MapEntityUIState extends GenericScenaristInterfaceState {}

export function getInitialMapEntityUIState(): MapEntityUIState {
  return {
    selected: {},
  };
}
