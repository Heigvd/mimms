import { Uid } from '../../game/common/interfaces';
import {
  getAllControllers,
  getController,
  RootCategories,
} from '../controllers/controllerInstances';
import { FlatTypes, SuperTypeNames } from '../controllers/dataController';

/**
 * Generic operations for deletion, creation, reordering, undo, redo and save
 * For Actions, Triggers, MapEntities
 */

export interface GenericScenaristInterfaceState {
  selected: Partial<Record<SuperTypeNames, Uid>>;
}

export function createNew(
  category: RootCategories,
  parentId: Uid,
  objectType: SuperTypeNames
): void {
  const controller = getController(category);
  controller.createNew(parentId, objectType);
}

export function remove(category: RootCategories, id: Uid): void {
  const controller = getController(category);
  controller.remove(id);
}

export function undo(category: RootCategories): void {
  getController(category).undo();
}

export function redo(category: RootCategories): void {
  getController(category).redo();
}

export function canUndo(category: RootCategories): boolean {
  return getController(category).canUndo();
}

export function canRedo(category: RootCategories): boolean {
  return getController(category).canRedo();
}

export function moveUp(category: RootCategories, id: Uid): void {
  getController(category).move(id, 'UP');
}

export function moveDown(category: RootCategories, id: Uid): void {
  getController(category).move(id, 'DOWN');
}

export function canMoveUp(category: RootCategories, id: Uid): void {
  getController(category).canMove(id, 'UP');
}

export function canMoveDown(category: RootCategories, id: Uid): void {
  getController(category).canMove(id, 'DOWN');
}

/*********************** READ FUNCTIONS ************************/

export function getFlatObjects(): Record<Uid, FlatTypes> {
  let result: Record<Uid, FlatTypes> = {};
  getAllControllers().forEach(controller => {
    result = { ...result, ...controller.getFlatDataClone() };
  });
  return result;
}
