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
// UI state

export interface GenericScenaristInterfaceState {
  selected: Partial<Record<SuperTypeNames, Uid>>;
}

// Directly used in the page
export function loadPageState(): GenericScenaristInterfaceState {
  return getController().getLatestIState();
}

export function select(itemType: SuperTypeNames, uid: Uid | undefined): void {
  getController().select(itemType, uid);
}

export function unselect(itemType: SuperTypeNames): void {
  getController().unselect(itemType);
}

export function getSelected(itemType: SuperTypeNames): FlatTypeDef | undefined {
  return getController().getSelected(itemType);
}

export function isSelected(itemType: SuperTypeNames, uid: Uid): boolean {
  return getSelected(itemType)?.uid === uid;
}

export function isSomethingSelected(itemType: SuperTypeNames): boolean {
  return getSelected(itemType) != undefined;
}

export function getSelectionColorClass(itemType: SuperTypeNames, uid: Uid): string {
  if (isSelected(itemType, uid)) {
    return 'theme-selected';
  }
  return 'theme-unselected';
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

export function getItem(itemType: SuperTypeNames, uid: Uid): FlatTypeDef | undefined {
  const item = getData()[uid];
  if (item?.superType === itemType) {
    return item;
  }
  return undefined;
}

let lastGenericAdded: string | null = null;

export function addNew(itemType: SuperTypeNames, parentType?: SuperTypeNames): FlatTypeDef {
  let parentId: Uid = '';
  if (parentType) {
    parentId = getSelected(parentType)?.uid ?? '';
  }

  const newItem = getController().createNew(parentId, itemType);
  lastGenericAdded = newItem.uid;
  return newItem;
}

export function isLastGenericAdded(uid: string): boolean {
  return lastGenericAdded === uid;
}

export function deleteItem(itemId: Uid): void {
  getController().remove(itemId);
}

//////////////////////////////////////////////////////////////////////////////////////
// detail page

export function getDetailPage(itemType: SuperTypeNames): string {
  switch (itemType) {
    case 'mapEntity':
      return 'scenaristItemMapEntity';
    case 'geometry':
      return 'scenaristItemMapObject';
    case 'trigger':
      return 'scenaristItemTrigger';
    case 'condition':
      return 'scenaristItemCondition';
    case 'impact':
      return 'scenaristItemImpact';
    case 'action':
      return 'scenaristItemAction';
    case 'choice':
      return 'scenaristItemChoice';
    case 'effect':
      return 'scenaristItemEffect';
    default:
      return 'scenaristItemUnknown';
  }
}

//////////////////////////////////////////////////////////////////////////////////////
// in list change

export function isAlone(itemId: Uid): boolean {
  return !canMoveUp(itemId) && !canMoveDown(itemId);
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
  const controllers = getAllControllers();
  for (const controller of controllers) {
    if (!controller.isSaved()) {
      controller.save();
    }
  }
}

export function isSaved(): boolean {
  const controllers = getAllControllers();
  return controllers.every(c => c.isSaved());
}

/*********************** READ FUNCTIONS ************************/

export function getFlatObjects(): Record<Uid, FlatTypes> {
  let result: Record<Uid, FlatTypes> = {};
  getAllControllers().forEach(controller => {
    result = { ...result, ...controller.getFlatDataClone() };
  });
  return result;
}
