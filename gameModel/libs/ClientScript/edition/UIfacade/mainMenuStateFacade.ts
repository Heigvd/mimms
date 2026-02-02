/**
 *  Main content loader page handler
 */
import { ValidationContext, ValidationResult } from './validationFacade';

// Note : must match the "exposeAs" of the scenarist menu state
export const MENU_CONTEXT_KEY = 'mainMenu';

export type Page =
  | 'map'
  | 'locations'
  | 'triggers'
  | 'actions'
  | 'patients'
  | 'hospitals'
  | 'resources';

export interface MenuUIState {
  menu: boolean;
  page: Page;
  validation: ValidationResult<ValidationContext>[];
}

export function getInitialMenuUIState(): MenuUIState {
  return {
    menu: true,
    page: 'map',
    validation: [],
  };
}

export function getMenuUIState(): MenuUIState {
  return Context[MENU_CONTEXT_KEY].state;
}

////////////////////////////////////////////////////////////////////////////////
// show / hide menu

export function getMenuState() {
  return getMenuUIState().menu;
}

export function toggleMenuState() {
  const newState: MenuUIState = Helpers.cloneDeep(getMenuUIState());
  newState.menu = !newState.menu;
  Context[MENU_CONTEXT_KEY].setState(newState);
}

////////////////////////////////////////////////////////////////////////////////
// select page to display

export function getCurrentPage(): Page {
  return getMenuUIState().page;
}

export function setCurrentPage(page: Page) {
  const newState: MenuUIState = Helpers.cloneDeep(getMenuUIState());
  newState.page = page;
  Context[MENU_CONTEXT_KEY].setState(newState);
}

export function displayCurrentPage(): string {
  switch (getCurrentPage()) {
    case 'map':
      return 'mapConfiguration';
    case 'locations':
      return 'locationsConfiguration';
    case 'triggers':
      return 'triggersConfiguration';
    case 'actions':
      return 'actionsConfiguration';
    case 'patients':
      return 'patientGeneration';
    case 'hospitals':
      return 'hospitalsConfig';
    case 'resources':
      return 'resourcesConfiguration';
    default:
      return 'mapConfiguration';
  }
}

////////////////////////////////////////////////////////////////////////////////
// validation results

export function getValidationResults(): ValidationResult<ValidationContext>[] {
  return getMenuUIState().validation;
}

export function setValidationResults(validation: ValidationResult<ValidationContext>[]): void {
  const newState: MenuUIState = Helpers.cloneDeep(getMenuUIState());
  newState.validation = [...validation];
  Context[MENU_CONTEXT_KEY].setState(newState);
}
