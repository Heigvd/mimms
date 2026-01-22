import { Uid } from '../../game/common/interfaces';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import {
  ControllerType,
  getAllControllers,
  getController,
} from '../controllers/controllerInstances';
import { FlatTypeBySuperType, FlatTypes, SuperTypeNames } from '../controllers/dataController';
import { getCurrentPage } from './mainMenuStateFacade';

/**
 * Generic operations for deletion, creation, reordering, undo, redo and save
 * For Actions, Triggers, MapEntities
 */

export function getCurrentController(): ControllerType {
  return getController(getCurrentPage());
}

//////////////////////////////////////////////////////////////////////////////////////
// UI state

export interface GenericScenaristInterfaceState {
  selected: Partial<Record<SuperTypeNames, Uid>>;
}

export type ModalState = 'opened' | 'closed';

// Directly used in the page
export function loadPageState(): GenericScenaristInterfaceState {
  return getCurrentController().getLatestIState();
}

export function select(itemType: SuperTypeNames, uid: Uid | undefined): void {
  getCurrentController().select(itemType, uid);
}

export function unselect(itemType: SuperTypeNames): void {
  getCurrentController().unselect(itemType);
}

export function getSelected(itemType: SuperTypeNames): FlatTypes | undefined {
  return getCurrentController().getSelected(itemType);
}

export function getSelectedTyped<S extends SuperTypeNames>(
  superType: S
): FlatTypeBySuperType[S] | undefined {
  return getCurrentController().getSelected(superType) as FlatTypeBySuperType[S];
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

export function getData(): Record<Uid, FlatTypes> {
  return getCurrentController().getFlatDataClone();
}

function getDataAsArray(): FlatTypes[] {
  return Object.values(getData());
}

export function getItems(itemType: SuperTypeNames, parentType?: SuperTypeNames): FlatTypes[] {
  let result: FlatTypes[] = [];

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

  return result.sort((a: FlatTypes, b: FlatTypes) => a.index - b.index);
}

export function getItemsTyped<S extends SuperTypeNames>(
  superType: S,
  parentType?: SuperTypeNames
): FlatTypeBySuperType[S][] {
  return getItems(superType, parentType) as FlatTypeBySuperType[S][];
}

/**
 * Returns the item with specified super type and id or undefined if not found or type doesn't match
 */
export function getItemTyped<S extends SuperTypeNames>(
  superType: S,
  id: Uid
): FlatTypeBySuperType[S] | undefined {
  const item = getFlatObjects()[id];
  if (item?.superType === superType) {
    return item as FlatTypeBySuperType[S];
  }
  return undefined;
}

let lastGenericAdded: string | null = null;

export function addNew(itemType: SuperTypeNames, parentType?: SuperTypeNames): FlatTypes {
  let parentId: Uid = '';
  if (parentType) {
    parentId = getSelected(parentType)?.uid ?? '';
  }

  const newItem = getCurrentController().createNew(parentId, itemType, parentType);
  lastGenericAdded = newItem.uid;
  setTimeout(() => {
    Helpers.scrollIntoView('.new-generic-item', { behavior: 'smooth', block: 'start' });
  }, 1);
  return newItem;
}

export function isLastGenericAdded(uid: string): boolean {
  return lastGenericAdded === uid;
}

export function deleteItem(itemId: Uid): void {
  getCurrentController().remove(itemId);
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
  return getCurrentController().canMove(itemId, 'UP');
}

export function canMoveDown(itemId: Uid): boolean {
  return getCurrentController().canMove(itemId, 'DOWN');
}

export function moveUp(itemId: Uid): void {
  getCurrentController().move(itemId, 'UP');
}

export function moveDown(itemId: Uid): void {
  getCurrentController().move(itemId, 'DOWN');
}

//////////////////////////////////////////////////////////////////////////////////////
// deletion permission

export function canBeDeleted(item: FlatTypes): boolean {
  if (item.superType === 'mapEntity') {
    return item.binding !== LOCATION_ENUM.chantier;
  }

  if (item.superType === 'action' || item.superType === 'trigger') {
    return !item.mandatory;
  }

  return true;
}

//////////////////////////////////////////////////////////////////////////////////////
// validation

export function validateItem(_itemType: SuperTypeNames, _uid: Uid) {}

//////////////////////////////////////////////////////////////////////////////////////
// undo - redo

export function undo(): void {
  getCurrentController().undo();
}

export function redo(): void {
  getCurrentController().redo();
}

export function canUndo(): boolean {
  return getCurrentController().canUndo();
}

export function canRedo(): boolean {
  return getCurrentController().canRedo();
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

export function getFlatObjects(): Readonly<Record<Uid, Readonly<FlatTypes>>> {
  let result: Record<Uid, FlatTypes> = {};
  getAllControllers().forEach(controller => {
    result = { ...result, ...controller.getFlatData() };
  });
  return result;
}

export function getParentType(itemId: Uid): SuperTypeNames | undefined {
  const allItems = getFlatObjects();
  const item = allItems[itemId];
  if (item?.parent) {
    return getFlatObjects()[item.parent]?.superType;
  }
  return undefined;
}
