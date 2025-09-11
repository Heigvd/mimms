import { Uid } from '../../game/common/interfaces';
import {
  ControllerType,
  getController as getTheController,
  RootCategories,
} from '../controllers/controllerInstances';
import { FlatTypeDef, SuperTypeNames } from '../controllers/dataController';

/**
 * Generic operations for deletion, creation, reordering, undo, redo and save
 * For Actions, Triggers, MapEntities
 */

// TODO generic
const INTERFACE_STATE_KEY = 'triggerConfigState';

export interface GenericScenaristInterfaceState {
  category: RootCategories;
  selected: Partial<Record<SuperTypeNames, Uid>>;
}

export function loadInitialState(category: RootCategories): GenericScenaristInterfaceState {
  return {
    category,
    selected: {},
  };
}

export function getState(): GenericScenaristInterfaceState {
  return Context[INTERFACE_STATE_KEY].state;
}

function getController(): ControllerType {
  return getTheController(getState().category);
}

//////////////////////////////////////////////////////////////////////////////////////
// selection

export function select(itemType: SuperTypeNames, uid: Uid | undefined): void {
  const newState = Helpers.cloneDeep(Context[INTERFACE_STATE_KEY].state);
  newState.selected[itemType] = uid;
  Context[INTERFACE_STATE_KEY].setState(newState);
}

export function unselect(itemType: SuperTypeNames): void {
  const newState = Helpers.cloneDeep(Context[INTERFACE_STATE_KEY].state);
  delete newState.selected[itemType];
  Context[INTERFACE_STATE_KEY].setState(newState);
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

export function addNew(itemType: SuperTypeNames, parentType?: SuperTypeNames): void {
  let parentId: Uid = '';
  if (parentType) {
    parentId = getSelected(parentType)?.uid ?? '';
  }

  getController().createNew(parentId, itemType);
}

export function deleteItem(itemId: Uid): void {
  getController().remove(itemId);
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
