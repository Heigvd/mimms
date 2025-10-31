import { GenericScenaristInterfaceState } from './genericConfigFacade';

export type ActionTemplateConfigUIState = GenericScenaristInterfaceState;

export function getInitialActionsUIState(): ActionTemplateConfigUIState {
  return {
    selected: {},
  };
}
