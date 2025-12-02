import { GenericScenaristInterfaceState } from './genericConfigFacade';

//////////////////////////////////////////////////////////////////////////////////////
// UI state

export type ActionTemplateConfigUIState = GenericScenaristInterfaceState;

export function getInitialActionUIState(): ActionTemplateConfigUIState {
  return {
    selected: {},
  };
}

//////////////////////////////////////////////////////////////////////////////////////
//
