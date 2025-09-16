import { GenericScenaristInterfaceState } from '../UIfacade/genericFacade';

export interface MapEntityInterfaceState extends GenericScenaristInterfaceState {
}


export function getInitialMapEntityUIState() : MapEntityInterfaceState {
  return {
    selected: {}
  }
}