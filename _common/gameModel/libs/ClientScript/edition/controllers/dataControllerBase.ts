// EVALUATION_PRIORITY 10

import {
  IDescriptor,
  Indexed,
  Parented,
  SuperTyped,
  Typed,
  Uid,
} from '../../game/common/interfaces';
import { entries, generateId, ObjectVariableClasses } from '../../tools/helper';
import {
  canMove,
  moveElement,
  OperationType,
  recomputeIndexes,
  recomputeIndexesFromArray,
} from '../../tools/indexedSorting';
import { scenarioEditionLogger } from '../../tools/logger';
import { parseObjectDescriptor, saveToObjectDescriptor } from '../../tools/WegasHelper';
import { FlatChoice } from '../typeDefinitions/choiceDefinition';
import { FlatCondition } from '../typeDefinitions/conditionDefinition';
import { ValidationMessage } from '../typeDefinitions/definition';
import { FlatEffect } from '../typeDefinitions/effectDefinition';
import { FlatImpact } from '../typeDefinitions/impactDefinition';
import { FlatMapEntity } from '../typeDefinitions/mapEntityDefinition';
import { FlatMapObject } from '../typeDefinitions/mapObjectDefinition';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { GenericValidationContext } from '../typeDefinitions/validation/validationContext';
import { GenericScenaristInterfaceState } from '../UIfacade/genericConfigFacade';
import { clusterSiblings, getAllSiblings, getSiblings, removeRecursively } from './parentedUtils';
import { ContextHandler } from './stateHandler';
import { UndoRedoContext } from './undoRedoContext';

export type FlatTypeDef = Typed & SuperTyped & IDescriptor & Indexed & Parented;

export type TriggerFlatType = FlatTrigger | FlatImpact | FlatCondition;
export type ActionTemplateFlatType = FlatActionTemplate | FlatChoice | FlatEffect | FlatImpact;
export type MapEntityFlatType = FlatMapEntity | FlatMapObject;

export type FlatTypes = TriggerFlatType | ActionTemplateFlatType | MapEntityFlatType;

export type FlatTypeBySuperType = {
  [K in FlatTypes['superType']]: Extract<FlatTypes, { superType: K }>;
};

export type FlatActivable = FlatTrigger | FlatActionTemplate | FlatChoice | FlatMapEntity;

/**
 * All the possible types of data objects (triggers, impacts, choices, ...)
 */
export type SuperTypeNames = FlatTypes['superType'];

export type CreationOptionsBase = {
  parentType?: SuperTypeNames;
  /**
   * when true replace the last stored state by the newly computed state
   */
  squashLastState?: boolean;
};
export abstract class DataControllerBase<
  DataType extends Typed & IDescriptor,
  FlatType extends FlatTypes,
  IState extends GenericScenaristInterfaceState,
  CreationOptions extends CreationOptionsBase,
  VContext extends GenericValidationContext
> {
  private readonly undoRedo: UndoRedoContext<IState, FlatType>;
  private readonly varKey: keyof ObjectVariableClasses;
  private readonly contextHandler: ContextHandler<IState>;
  private transientIState: IState;

  constructor(
    variableKey: keyof ObjectVariableClasses,
    contextKey: string,
    initialUIState: IState
  ) {
    this.varKey = variableKey;
    const desc = Variable.find(gameModel, variableKey);
    const data = parseObjectDescriptor<DataType>(desc) || {};
    this.contextHandler = new ContextHandler<IState>(contextKey);
    this.transientIState = initialUIState;
    this.undoRedo = new UndoRedoContext<IState, FlatType>(this.transientIState, this.flatten(data));
  }

  public save(): void {
    const desc = Variable.find(gameModel, this.varKey);
    saveToObjectDescriptor(desc, this.recompose(this.undoRedo.getCurrentState()[1]));
    this.undoRedo.onSave();
  }

  public isSaved(): boolean {
    return this.undoRedo.isSaved();
  }

  public remove(id: Uid): void {
    const flatData = this.getFlatDataClone();
    const siblings = getSiblings(id, flatData);
    const removedIds = removeRecursively(id, flatData);
    const updatedIState = this.getLatestIState();

    entries(updatedIState.selected).forEach(([superType, id]) => {
      if (id && removedIds.has(id)) {
        delete updatedIState.selected[superType];
      }
    });

    // re-index
    delete siblings[id];
    recomputeIndexes(siblings);

    this.applyChanges(flatData, updatedIState, false);
  }

  public duplicate(id: Uid): void {
    const updatedData = this.getFlatDataClone();
    const original = updatedData[id];
    if(original){
      const cloned = this.duplicateInternal(original);

      // insert cloned data
      cloned.forEach(c => {
        updatedData[c.uid] = c;
      });

      const updatedIState = this.getLatestIState();

      // select new
      if (cloned.length > 0) {
        updatedIState.selected[original.superType] = cloned[0]?.uid;
      }

      // TODO figure out where the clone is inserted
      //moveElement(clone.uid, siblings, '');

      this.applyChanges(updatedData, updatedIState, false);
    } else {
      scenarioEditionLogger.error('Could not clone object with id ' + id + '. not found in data');
    }
  }

  /**
   * The implementation duplicates this element and all of its children
   * Convention : the first element of the array is the copy of the passed original
   */
  protected abstract duplicateInternal(original: FlatType): FlatType[];

  /**
   * Duplicates the given element (without children)
   * The mapping is meant to contain the existing <originalId, cloneId>
   * If the mapping contains a new id for the original's parent, the created clone object is reparented
   * Returns the cloned element
   */
  protected basicDuplicate(original: FlatType, mapping: Record<Uid, Uid>): FlatType {
    const clone = Helpers.cloneDeep(original);
    clone.uid = generateId(10);
    mapping[original.uid] = clone.uid;

    // if the parent has been cloned too => reparent the cloned element
    if (mapping[original.parent]) {
      clone.parent = mapping[original.parent]!;
    }
    return clone;
  }

  public canUndo(): boolean {
    return this.undoRedo.canUndo();
  }

  public canRedo(): boolean {
    return this.undoRedo.canRedo();
  }

  public undo(): void {
    const previous = this.undoRedo.undo();
    this.transientIState = previous[0];
    this.contextHandler.setState(previous[0]);
    this.save();
  }

  public redo(): void {
    const next = this.undoRedo.redo();
    this.transientIState = next[0];
    this.contextHandler.setState(next[0]);
    this.save();
  }

  public createNew(
    parentId: Uid,
    superType: SuperTypeNames, //MapToSuperTypeNames<FlatType>,
    options: CreationOptions
  ): FlatType {
    const newObject = this.createNewInternal(parentId, superType, options);
    const updatedData = this.getFlatDataClone();
    updatedData[newObject.uid] = newObject;
    // select new
    const updatedIState = this.getLatestIState();
    updatedIState.selected[superType] = newObject.uid;
    // put at top
    const siblings = this.filterSiblings(newObject.uid, updatedData);
    moveElement(newObject.uid, siblings, 'BOTTOM');

    this.applyChanges(updatedData, updatedIState, options.squashLastState ?? false);
    return newObject;
  }

  public getTreeData(): Record<string, DataType> {
    return this.recompose(this.getFlatDataClone());
  }

  public getFlatDataClone(): Record<Uid, FlatType> {
    return Helpers.cloneDeep(this.undoRedo.getCurrentState()[1]);
  }

  public move(id: Uid, moveType: OperationType): void {
    const data = this.getFlatDataClone();
    const siblings = this.filterSiblings(id, data);
    moveElement(id, siblings, moveType);
    this.updateData(data);
  }

  public canMove(id: Uid, moveType: OperationType): boolean {
    const siblings = this.filterSiblings(id, this.undoRedo.getCurrentState()[1]);
    if (Object.values(siblings).length == 0) {
      return false;
    }
    return canMove(id, siblings, moveType);
  }

  public getSelected(itemType: SuperTypeNames): FlatTypes | undefined {
    const selectedUid = this.getLatestIState().selected[itemType];
    if (selectedUid) {
      return this.getFlatDataClone()[selectedUid];
    }
    return undefined;
  }

  public select(itemType: SuperTypeNames, uid: Uid | undefined): void {
    if (uid == undefined) {
      this.unselect(itemType);
    } else {
      const selectedUid = this.getLatestIState().selected[itemType];
      if (selectedUid !== uid) {
        this.unselect(itemType); // used to cascade the unselect (see unselect overrides)

        const newState: IState = Helpers.cloneDeep(this.getLatestIState());
        newState.selected[itemType] = uid;
        this.updateIState(newState);
      }
    }
  }

  public unselect(itemType: SuperTypeNames): void {
    const newState: IState = Helpers.cloneDeep(this.getLatestIState());
    delete newState.selected[itemType];
    this.updateIState(newState);
  }

  public validate(): ValidationMessage<VContext>[] {
    const result: ValidationMessage<VContext>[] = [];

    Object.values(this.getTreeData()).forEach((item: DataType) => {
      result.push(...this.validateInternal(item));
    });

    return result;
  }

  protected abstract validateInternal(item: DataType): ValidationMessage<VContext>[];

  public updateItem(item: FlatType) {
    const data: Record<Uid, FlatType> = this.getFlatDataClone();
    data[item.uid] = item;
    this.updateData(data);
  }

  public updateData(
    newData: Record<Uid, FlatType>,
    indexesUpdate: boolean = true,
    newInterfaceState: IState | undefined = undefined,
    squashLastState: boolean = false
  ): void {
    const iState = newInterfaceState || this.getLatestIState();
    if (indexesUpdate) {
      // get siblings grouped by same parent and supertype
      const allSiblings = getAllSiblings(newData);
      // cluster siblings in their specific subgroups (e.g. mandatory / optional, map categories)
      Object.values(allSiblings).forEach(group => {
        clusterSiblings(group, this.isSibling).forEach(cluster =>
          recomputeIndexesFromArray(cluster)
        );
      });
    }
    this.applyChanges(newData, iState, squashLastState);
  }

  /**
   * Updates the transient interface state
   */
  public updateIState(newInterfaceState: IState): void {
    this.transientIState = newInterfaceState;
    this.contextHandler.setState(this.transientIState);
  }

  public softUpdateIState(newInterfaceState: IState): void {
    this.transientIState = newInterfaceState;
  }

  public getLatestIState(): IState {
    return Helpers.cloneDeep(this.transientIState);
  }

  private filterSiblings(id: Uid, data: Record<string, FlatType>): Record<string, FlatType> {
    const target = data[id];
    // get natural siblings
    const siblings = getSiblings(id, data);
    const filtered: Record<string, FlatType> = {};
    Object.entries(siblings).forEach(([key, candidate]) => {
      if (target && this.isSibling(target, candidate)) {
        filtered[key] = candidate;
      }
    });
    return filtered;
  }

  /** Converts the original data to a flat structure */
  protected abstract flatten(input: Record<Uid, DataType>): Record<Uid, FlatType>;

  /**
   * Rebuilds a genuine object from a flat data representation
   */
  protected abstract recompose(flattened: Record<Uid, FlatType>): Record<Uid, DataType>;

  /**
   * Advanced sibling filtering. Given a target and a candidate that share the same parent,
   * this function has to determine if those natural siblings belong to the same group
   * (example : triggers are split between mandatory and non-mandatory)
   */
  protected abstract isSibling(target: FlatType, candidate: FlatType): boolean;

  /** Creates a new object of the desired type */
  protected abstract createNewInternal(
    parentId: Uid,
    type: SuperTypeNames, //MapToSuperTypeNames<FlatType>
    options: CreationOptions
  ): FlatType;

  /**
   * Read-only data, handle with care
   */
  public getFlatData(): Readonly<Record<Uid, Readonly<FlatType>>> {
    return this.undoRedo.getCurrentState()[1];
  }

  public getItem<T extends FlatType>(id: Uid, type: T['superType']): Readonly<T> | undefined {
    const item = this.getFlatData()[id];

    if (item && item.superType === type) {
      return item as T; // safe cast
    }

    return undefined;
  }

  private applyChanges(
    newData: Record<Uid, FlatType>,
    newInterfaceState: IState,
    squashPrevious: boolean
  ): void {
    this.undoRedo.storeState(newInterfaceState, newData, squashPrevious);
    this.transientIState = newInterfaceState;
    this.contextHandler.setState(newInterfaceState);
    this.save();
  }
}
