/**
 *  Main content loader page handler
 */
import { ValidationMessage } from '../typeDefinitions/definition';
import { computeValidationMessages } from '../UIfacade/validationFacade';

// Note : must match the "exposeAs" of the scenarist menu state
export const MENU_CONTEXT_KEY = 'mainMenu';

export type Page =
  | 'map'
  | 'locations'
  | 'triggers'
  | 'actions'
  | 'patients'
  | 'hospitals'
  | 'resources'
  | 'validation';

export interface MenuUIState {
  menu: boolean;
  page: Page;
  validation: ValidationMessage<any>[];
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

  if (page === 'validation') {
    newState.validation = computeValidationMessages();
  }

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
    case 'validation':
      return 'scenaristValidation';
    default:
      return 'mapConfiguration';
  }
}

////////////////////////////////////////////////////////////////////////////////
// validation results

export function getValidationMessages(): ValidationMessage<any>[] {
  return getMenuUIState().validation;
}

export function setValidationMessages(validation: ValidationMessage<any>[]): void {
  const newState: MenuUIState = Helpers.cloneDeep(getMenuUIState());
  newState.validation = [...validation];
  Context[MENU_CONTEXT_KEY].setState(newState);
}

////////////////////////////////////////////////////////////////////////////////
// menu tabs shown depending on game mode

export function isPretriMode(): boolean {
  return Variable.find(gameModel, 'gameMode').getValue(self) === 'pretriMode';
}

export function getGameMode(): string {
  if (isPretriMode()) {
    return 'patientGeneration';
  }
  return 'scenaristMainMenu';
}
