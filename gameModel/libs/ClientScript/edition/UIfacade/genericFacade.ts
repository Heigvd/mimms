import { Uid } from '../../game/common/interfaces';
import { getController, RootCategories } from '../controllers/controllerInstances';
import { SuperTypeNames } from '../dataController';

/**
 * Generic operations for deletion, creation, reordering, undo, redo and save
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

export interface TriggerInterfaceState extends GenericScenaristInterfaceState {
  /* TODO in other file */
}

export interface ActionTemplateInterfaceState extends GenericScenaristInterfaceState {
  /* TODO in other file */
}
