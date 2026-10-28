import { Uid } from '../../game/common/interfaces';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { compareByIndex } from '../../tools/indexedSorting';
import { scenarioEditionLogger } from '../../tools/logger';
import {
  ControllerType,
  getAllControllers,
  getController,
} from '../controllers/controllerInstances';
import {
  CreationOptionsBase,
  FlatTypeBySuperType,
  FlatTypes,
  SuperTypeNames,
} from '../controllers/dataControllerBase';
import { getSiblings } from '../controllers/parentedUtils';
import { getCurrentPage } from './mainMenuStateFacade';

/**
 * Generic operations for deletion, creation, reordering, undo, redo and save
 * For Actions, Triggers, MapEntities
 */

export function getCurrentController(): ControllerType | undefined {
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
  return getCurrentController()?.getLatestIState() || { selected: {} };
}

export function select(itemType: SuperTypeNames, uid: Uid | undefined): void {
  getCurrentController()?.select(itemType, uid);
}

export function unselect(itemType: SuperTypeNames): void {
  getCurrentController()?.unselect(itemType);
}

export function getSelectedReadOnly(itemType: SuperTypeNames): Readonly<FlatTypes> | undefined {
  return getCurrentController()?.getSelected(itemType);
}

export function getSelectedTypedReadOnly<S extends SuperTypeNames>(
  superType: S
): Readonly<FlatTypeBySuperType[S]> | undefined {
  return getSelectedReadOnly(superType) as FlatTypeBySuperType[S];
}

export function isSelected(itemType: SuperTypeNames, uid: Uid): boolean {
  return getSelectedReadOnly(itemType)?.uid === uid;
}

export function isSomethingSelected(itemType: SuperTypeNames): boolean {
  return getSelectedReadOnly(itemType) != undefined;
}

export function getSelectionColorClass(itemType: SuperTypeNames, uid: Uid): string {
  if (isSelected(itemType, uid)) {
    return 'theme-selected';
  }
  return 'theme-unselected';
}

//////////////////////////////////////////////////////////////////////////////////////
// items

function getDataReadOnly(): Readonly<Record<Uid, Readonly<FlatTypes>>> {
  return getCurrentController()?.getFlatData() || {};
}

export function getItems(itemType: SuperTypeNames, parentType?: SuperTypeNames): FlatTypes[] {
  let result: FlatTypes[] = [];

  const dataArray = Object.values(getDataReadOnly());
  if (parentType == undefined) {
    result = dataArray.filter(item => item.superType === itemType);
  } else {
    const selectedParent = getSelectedReadOnly(parentType)?.uid;
    if (selectedParent !== undefined) {
      result = dataArray.filter(
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

export function addNew<T extends CreationOptionsBase>(
  itemType: SuperTypeNames,
  parentType?: SuperTypeNames,
  creationOptions?: T
): FlatTypes | undefined {
  let parentId: Uid = '';
  if (parentType) {
    parentId = getSelectedReadOnly(parentType)?.uid ?? '';
  }
  const options: CreationOptionsBase = creationOptions ?? {};
  options.parentType = parentType;
  const controller = getCurrentController();
  if (controller) {
    const newItem = controller.createNew(parentId, itemType, options);
    lastGenericAdded = newItem.uid;
    setTimeout(() => {
      Helpers.scrollIntoView('.new-generic-item', { behavior: 'smooth', block: 'start' });
    }, 1);
    return newItem;
  } else {
    scenarioEditionLogger.warn(`No controller found, could not add new ${itemType}`);
    return undefined;
  }
}

export function isLastGenericAdded(uid: string): boolean {
  return lastGenericAdded === uid;
}

export function deleteItem(itemId: Uid): void {
  const controller = getCurrentController();
  if (controller) {
    controller.remove(itemId);
  } else {
    scenarioEditionLogger.warn(`No controller found, could not delete ${itemId}`);
  }
}

export function duplicateItem(itemId: Uid): void {
  const controller = getCurrentController();
  if (controller) {
    controller.duplicate(itemId);
  } else {
    scenarioEditionLogger.warn(`No controller found, could not duplicate ${itemId}`);
  }
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

// an effect's first feedback impact is the one always guaranteed to exist, it must stay in place
// (further feedback impacts a scenarist adds manually behave like regular impacts)
function isLockedInPlace(item: FlatTypes | undefined): boolean {
  if (item?.superType !== 'impact' || item.type !== 'feedback') {
    return false;
  }
  const feedbackSiblings = Object.values(getSiblings(item.uid, getDataReadOnly()))
    .filter(sibling => sibling.superType === 'impact' && sibling.type === 'feedback')
    .sort(compareByIndex);
  return feedbackSiblings[0]?.uid === item.uid;
}

function isMovable(itemId: Uid): boolean {
  return !isLockedInPlace(getDataReadOnly()[itemId]);
}

// the sibling right above, sorted by index (undefined if itemId is already first)
function getPreviousSibling(itemId: Uid): FlatTypes | undefined {
  const data = getDataReadOnly();
  const siblings = Object.values(getSiblings(itemId, data)).sort(compareByIndex);
  const itemIndex = siblings.findIndex(sibling => sibling.uid === itemId);
  return itemIndex > 0 ? siblings[itemIndex - 1] : undefined;
}

export function canMoveUp(itemId: Uid): boolean {
  return (
    isMovable(itemId) &&
    !isLockedInPlace(getPreviousSibling(itemId)) &&
    (getCurrentController()?.canMove(itemId, 'UP') || false)
  );
}

export function canMoveDown(itemId: Uid): boolean {
  return isMovable(itemId) && (getCurrentController()?.canMove(itemId, 'DOWN') || false);
}

export function moveUp(itemId: Uid): void {
  getCurrentController()?.move(itemId, 'UP') || false;
}

export function moveDown(itemId: Uid): void {
  getCurrentController()?.move(itemId, 'DOWN') || false;
}

//////////////////////////////////////////////////////////////////////////////////////
// deletion (& duplication) permission

export function canBeDeleted(item: FlatTypes): boolean {
  if (item.superType === 'mapEntity') {
    return item.binding !== LOCATION_ENUM.chantier && item.binding !== LOCATION_ENUM.entreeChantier;
  }

  if (item.superType === 'action' || item.superType === 'trigger') {
    return !item.mandatory;
  }

  return !isLockedInPlace(item);
}

//////////////////////////////////////////////////////////////////////////////////////
// validation

export function validateItem(_itemType: SuperTypeNames, _uid: Uid) {}

//////////////////////////////////////////////////////////////////////////////////////
// undo - redo

export function undo(): void {
  getCurrentController()?.undo();
}

export function redo(): void {
  getCurrentController()?.redo();
}

export function canUndo(): boolean {
  return getCurrentController()?.canUndo() || false;
}

export function canRedo(): boolean {
  return getCurrentController()?.canRedo() || false;
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
