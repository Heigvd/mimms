/**
 *  Main content loader page handler
 */
type Page = 'map' | 'locations' | 'triggers' | 'actions' | 'patients' | 'hospitals' | 'resources';

export function setCurrentPage(page: Page) {
  const newState = Helpers.cloneDeep(Context.menu.state);
  newState.page = page;
  Context.menu.setState(newState);
}

export function getCurrentPage(): Page {
  return Context.menu.state.page;
}

export function toggleMenu() {
  const newState = Helpers.cloneDeep(Context.menu.state);
  newState.menu = !newState.menu;
  Context.menu.setState(newState);
}

export function getCurrentMenuState() {
  return Context.menu.state.menu;
}

/**
 *  Menu state
 */
export interface MenuUIState {
  menu: boolean;
  page: Page;
}

export function getInitialMenuUIState(): MenuUIState {
  return {
    menu: true,
    page: 'map',
  };
}
