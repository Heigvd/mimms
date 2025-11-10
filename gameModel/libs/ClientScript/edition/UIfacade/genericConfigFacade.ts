import { Uid } from '../../game/common/interfaces';
import {
  ControllerType,
  getAllControllers,
  getController as getTheController,
} from '../controllers/controllerInstances';
import { FlatTypeDef, FlatTypes, SuperTypeNames } from '../controllers/dataController';
import { getCurrentPage } from './mainMenuStateFacade';

/**
 * Generic operations for deletion, creation, reordering, undo, redo and save
 * For Actions, Triggers, MapEntities
 */

function getController(): ControllerType {
  return getTheController(getCurrentPage());
}

//////////////////////////////////////////////////////////////////////////////////////
// page state

// Note : must match the "exposeAs" of the state
export const PAGE_CONTEXT_KEY = 'pageState';

export interface GenericScenaristInterfaceState {
  selected: Partial<Record<SuperTypeNames, Uid>>;
}

export function getInitialPageState() {
  return { selected: {} };
}

// Directly used in the page
export function loadPageState(): GenericScenaristInterfaceState {
  const storedState = getController()?.getLatestIState();
  if (storedState) {
    return { ...storedState };
  }

  return getInitialPageState();
}

export function getState(): GenericScenaristInterfaceState {
  return Context[PAGE_CONTEXT_KEY].state;
}

export function setState(newState: GenericScenaristInterfaceState): void {
  Context[PAGE_CONTEXT_KEY].setState(newState);
}

//////////////////////////////////////////////////////////////////////////////////////
// selection

export function select(itemType: SuperTypeNames, uid: Uid | undefined): void {
  const newState: GenericScenaristInterfaceState = Helpers.cloneDeep(getState());
  newState.selected[itemType] = uid;
  setState(newState);
  getController().updateIState(newState);
}

export function unselect(itemType: SuperTypeNames): void {
  const newState: GenericScenaristInterfaceState = Helpers.cloneDeep(getState());
  delete newState.selected[itemType];
  setState(newState);
  getController().updateIState(newState);
}

export function getSelected(itemType: SuperTypeNames): FlatTypeDef | undefined {
  const selectedUid = getState().selected[itemType];
  if (selectedUid) {
    return getData()[selectedUid];
  }
  return undefined;
}

export function isSelected(itemType: SuperTypeNames, uid: Uid): boolean {
  return getSelected(itemType)?.uid === uid;
}

export function isSomethingSelected(itemType: SuperTypeNames): boolean {
  return getSelected(itemType) != undefined;
}

//////////////////////////////////////////////////////////////////////////////////////
// items

export function getData(): Record<Uid, FlatTypeDef> {
  return getController().getFlatDataClone();
}

function getDataAsArray(): FlatTypeDef[] {
  return Object.values(getData());
}

export function getItems(itemType: SuperTypeNames, parentType?: SuperTypeNames): FlatTypeDef[] {
  let result: FlatTypeDef[] = [];

  if (parentType == undefined) {
    result = getDataAsArray().filter(item => item.superType === itemType);
  } else {
    const selectedParent = getSelected(parentType)?.uid;
    if (selectedParent !== undefined) {
      result = getDataAsArray().filter(
        item => item.superType === itemType && item.parent === selectedParent
      );
    }
  }

  return result.sort((a: FlatTypeDef, b: FlatTypeDef) => a.index - b.index);
}

export function addNew(itemType: SuperTypeNames, parentType?: SuperTypeNames): FlatTypeDef {
  let parentId: Uid = '';
  if (parentType) {
    parentId = getSelected(parentType)?.uid ?? '';
  }

  const newItem = getController().createNew(parentId, itemType);
  lastGenericAdded = newItem.uid;
  return newItem;
}

export function deleteItem(itemId: Uid): void {
  getController().remove(itemId);
}

let lastGenericAdded: string | null = null;

export function getLastGenericAdded(uid: string): boolean {
  return lastGenericAdded === uid;
}

//////////////////////////////////////////////////////////////////////////////////////
// detail page

export function getDetailPage(itemType: SuperTypeNames): string {
  switch (itemType) {
    case 'trigger':
      return 'scenaristItemTrigger';
    case 'condition':
      return 'scenaristItemCondition';
    case 'impact':
      return 'scenaristItemImpact';
    default:
      return 'scenaristItemUnknown';
  }
}

//////////////////////////////////////////////////////////////////////////////////////
// in list change

export function isAlone(itemId: Uid): boolean {
  return !canMoveUp(itemId) && !canMoveDown(itemId); // for the moment, not handled
}

export function canMoveUp(itemId: Uid): boolean {
  return getController().canMove(itemId, 'UP');
}

export function canMoveDown(itemId: Uid): boolean {
  return getController().canMove(itemId, 'DOWN');
}

export function moveUp(itemId: Uid): void {
  getController().move(itemId, 'UP');
}

export function moveDown(itemId: Uid): void {
  getController().move(itemId, 'DOWN');
}

//////////////////////////////////////////////////////////////////////////////////////
// validation

export function validateItem(_itemType: SuperTypeNames, _uid: Uid) {}

//////////////////////////////////////////////////////////////////////////////////////
// undo - redo

export function undo(): void {
  getController().undo();
}

export function redo(): void {
  getController().redo();
}

export function canUndo(): boolean {
  return getController().canUndo();
}

export function canRedo(): boolean {
  return getController().canRedo();
}

//////////////////////////////////////////////////////////////////////////////////////
// save

export function saveToVariable(): void {
  getController().save();
}

export function isSaved(): boolean {
  return getController().isSaved();
}

/*********************** READ FUNCTIONS ************************/

export function getFlatObjects(): Record<Uid, FlatTypes> {
  let result: Record<Uid, FlatTypes> = {};
  getAllControllers().forEach(controller => {
    result = { ...result, ...controller.getFlatDataClone() };
  });
  return result;
}
