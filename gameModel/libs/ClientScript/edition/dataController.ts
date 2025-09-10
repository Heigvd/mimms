import { TemplateDescriptor } from '../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../game/common/actions/choiceDescriptor/choiceDescriptor';
import { IDescriptor, Indexed, Parented, SuperTyped, Typed, Uid } from '../game/common/interfaces';
import { Trigger } from '../game/common/triggers/trigger';
import { Effect } from '../game/common/impacts/effect';
import { filterRecord, ObjectVariableClasses } from '../tools/helper';
import { parseObjectDescriptor, saveToObjectDescriptor } from '../tools/WegasHelper';
import {
  FlatChoice,
  fromFlatChoice,
  getChoiceDefinition,
  toFlatChoice,
} from './typeDefinitions/choiceDefinition';
import {
  FlatCondition,
  fromFlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from './typeDefinitions/conditionDefinition';
import { MapToSuperTypeNames } from './typeDefinitions/definition';
import { FlatEffect, fromFlatEffect, toFlatEffect } from './typeDefinitions/effectDefinition';
import {
  FlatImpact,
  fromFlatImpact,
  getImpactDefinition,
  toFlatImpact,
} from './typeDefinitions/impactDefinition';
import {
  FlatActionTemplate,
  fromFlatActionTemplate,
  getTemplateDef,
  toFlatActionTemplate,
} from './typeDefinitions/templateDefinition';
import {
  FlatTrigger,
  fromFlatTrigger,
  getTriggerDefinition,
  toFlatTrigger,
} from './typeDefinitions/triggerDefinition';
import { UndoRedoContext } from './undoRedoContext';
import { Impact } from '../game/common/impacts/impact';
import { group } from '../tools/groupBy';
import { scenarioEditionLogger } from '../tools/logger';
import { ContextHandler } from './controllers/stateHandler';
import {
  ActionTemplateInterfaceState,
  GenericScenaristInterfaceState,
  TriggerInterfaceState,
} from './UIfacade/genericFacade';
import { moveElement, OperationType } from '../tools/indexedSorting';

type FlatTypeDef = Typed & SuperTyped & IDescriptor & Indexed & Parented;

type TriggerFlatType = FlatTrigger | FlatImpact | FlatCondition;
type ActionTemplateFlatType = FlatActionTemplate | FlatChoice | FlatEffect | FlatImpact;
// TODO map entities

/**
 * All the possible types of data objects (triggers, impacts, choices, ...)
 */
export type SuperTypeNames = MapToSuperTypeNames<TriggerFlatType | ActionTemplateFlatType>;

export abstract class DataControllerBase<
  DataType extends Typed,
  FlatType extends FlatTypeDef,
  IState extends GenericScenaristInterfaceState
> {
  protected readonly undoRedo: UndoRedoContext<IState, FlatType>;
  private readonly varKey: keyof ObjectVariableClasses;
  private readonly contextHandler: ContextHandler<IState>;

  constructor(variableKey: keyof ObjectVariableClasses, contextKey: string) {
    this.varKey = variableKey;
    const desc = Variable.find(gameModel, variableKey);
    const data = parseObjectDescriptor<DataType>(desc) || {};
    this.contextHandler = new ContextHandler<IState>(contextKey);
    this.undoRedo = new UndoRedoContext<IState, FlatType>(
      this.contextHandler.getCurrentState(),
      this.flatten(data)
    );
  }

  public save(): void {
    // Validation here ?
    const desc = Variable.find(gameModel, this.varKey);
    saveToObjectDescriptor(desc, this.recompose(this.undoRedo.getCurrentState()[1]));
    this.undoRedo.onSave();
  }

  public remove(id: Uid): void {
    const flatData = this.getFlatDataClone();
    const removedIds = this.removeRecursively(id, flatData);
    const updatedIState = this.contextHandler.getCurrentState();

    Object.entries(updatedIState.selected).forEach(([superType, id]) => {
      if (removedIds.has(id)) {
        delete updatedIState.selected[superType as SuperTypeNames];
      }
    });

    this.applyChanges(flatData, updatedIState);
  }

  public canUndo(): boolean {
    return this.undoRedo.canUndo();
  }

  public canRedo(): boolean {
    return this.undoRedo.canRedo();
  }

  public undo(): void {
    const previous = this.undoRedo.undo();
    this.contextHandler.setState(previous[0]);
  }

  public redo(): void {
    const next = this.undoRedo.redo();
    this.contextHandler.setState(next[0]);
  }

  public createNew(
    parentId: Uid,
    superType: SuperTypeNames //MapToSuperTypeNames<FlatType>,
  ): FlatType {
    const newObject = this.createNewInternal(parentId, superType);
    const updatedData = this.getFlatDataClone();
    updatedData[newObject.uid] = newObject;
    const updatedIState = this.contextHandler.getCurrentState();
    this.applyChanges(updatedData, updatedIState);
    return newObject;
  }

  public getTreeData(): Record<string, DataType> {
    return this.recompose(this.undoRedo.getCurrentState()[1]);
  }

  public getFlatDataClone(): Record<Uid, FlatType> {
    return Helpers.cloneDeep(this.undoRedo.getCurrentState()[1]);
  }

  public move(id: Uid, moveType: OperationType): void {
    const data = this.getFlatDataClone();
    const target = data[id];
    const siblings = filterRecord(
      data,
      e => e.parent === target?.parent && e.superType == target?.superType
    );
    moveElement(id, siblings, moveType);
    this.updateData(data);
  }

  public updateData(
    newData: Record<Uid, FlatType>,
    newInterfaceState: IState | undefined = undefined
  ): void {
    const iState = newInterfaceState || this.contextHandler.getCurrentState();
    this.applyChanges(newData, iState);
  }

  /** Converts the original data to a flat structure */
  protected abstract flatten(input: Record<Uid, DataType>): Record<Uid, FlatType>;

  /**
   * Rebuilds a genuine object from a flat data representation
   */
  protected abstract recompose(flattened: Record<Uid, FlatType>): Record<Uid, DataType>;

  /** Creates a new object of the desired type */
  protected abstract createNewInternal(
    parentId: Uid,
    type: SuperTypeNames //MapToSuperTypeNames<FlatType>
  ): FlatType;

  private applyChanges(newData: Record<Uid, FlatType>, newInterfaceState: IState): void {
    this.undoRedo.storeState(newInterfaceState, newData);
    this.contextHandler.setState(newInterfaceState);
  }

  private removeRecursively(id: Uid, data: Record<Uid, FlatType>): Set<Uid> {
    const parentList: Uid[] = [id];
    const removed: Set<Uid> = new Set<Uid>();

    while (parentList.length > 0) {
      const parent = parentList.pop()!;
      const toRemove = [parent];
      Object.entries(data)
        .filter(([_uid, obj]) => obj.parent === parent)
        .forEach(([uid, _obj]) => {
          toRemove.push(uid);
          parentList.push(uid);
        });
      toRemove.forEach(uid => {
        delete data[uid];
        removed.add(uid);
      });
    }
    return removed;
  }
}

export class TriggerDataController extends DataControllerBase<
  Trigger,
  TriggerFlatType,
  TriggerInterfaceState
> {
  private static readonly TRIGGER_ROOT: string = 'TRIGGER_ROOT';

  protected override flatten(input: Record<Uid, Trigger>): Record<Uid, TriggerFlatType> {
    const flattened: Record<Uid, TriggerFlatType> = {};
    Object.entries(input).forEach(([uid, trigger]) => {
      flattened[uid] = toFlatTrigger(trigger, TriggerDataController.TRIGGER_ROOT);
      trigger.impacts.forEach(impact => {
        flattened[impact.uid] = toFlatImpact(impact, uid);
      });
      trigger.conditions.forEach(condition => {
        flattened[condition.uid] = toFlatCondition(condition, uid);
      });
    });
    return flattened;
  }

  protected override recompose(flattened: Record<Uid, TriggerFlatType>): Record<Uid, Trigger> {
    const tree: Record<Uid, Trigger> = {};
    // create triggers with empty impacts and conditions
    Object.values(flattened)
      .filter(element => element.superType === 'trigger')
      .map(e => e as FlatTrigger) // safe cast
      .forEach((trigger: FlatTrigger) => {
        tree[trigger.uid] = fromFlatTrigger(trigger);
      });

    // fill in impacts and conditions
    Object.values(flattened)
      .filter(elem => elem.superType === 'impact' || elem.superType === 'condition')
      .forEach((element: TriggerFlatType) => {
        const parentTrigger = tree[element.parent];
        if (parentTrigger) {
          if (element.superType === 'condition') {
            parentTrigger.conditions.push(fromFlatCondition(element));
          } else if (element.superType === 'impact') {
            parentTrigger.impacts.push(fromFlatImpact(element));
          }
        } else {
          scenarioEditionLogger.error(
            'Found some orphan impact/condition in trigger data',
            element
          );
        }
      });
    return tree;
  }

  protected override createNewInternal(
    parentId: Uid,
    superType: MapToSuperTypeNames<TriggerFlatType>
  ): TriggerFlatType {
    // TODO we might want to define an "empty NoOp" type for conditions and impacts and give at as default
    switch (superType) {
      case 'trigger':
        return toFlatTrigger(
          getTriggerDefinition().getDefault(),
          TriggerDataController.TRIGGER_ROOT
        );
      case 'condition':
        return toFlatCondition(getConditionDefinition('time').getDefault(), parentId);
      case 'impact':
        return toFlatImpact(getImpactDefinition('activation').getDefault(), parentId);
    }
  }
}

export class ActionTemplateDataController extends DataControllerBase<
  TemplateDescriptor,
  ActionTemplateFlatType,
  ActionTemplateInterfaceState
> {
  private static readonly ACTION_ROOT: string = 'ACTION_ROOT';

  protected override flatten(
    tree: Record<Uid, TemplateDescriptor>
  ): Record<Uid, ActionTemplateFlatType> {
    const flattened: Record<Uid, ActionTemplateFlatType> = {};
    Object.entries(tree).forEach(([uid, tpld]) => {
      flattened[uid] = toFlatActionTemplate(tpld, ActionTemplateDataController.ACTION_ROOT);
      // choices
      tpld.choices.forEach((choice: ChoiceDescriptor) => {
        flattened[choice.uid] = toFlatChoice(choice, tpld.uid);
        // effects
        choice.effects.forEach((effect: Effect) => {
          flattened[effect.uid] = toFlatEffect(choice.uid);
          // impacts
          effect.impacts.forEach((impact: Impact) => {
            flattened[impact.uid] = toFlatImpact(impact, effect.uid);
          });
        });
      });
    });
    return flattened;
  }

  protected override recompose(
    flattened: Record<Uid, ActionTemplateFlatType>
  ): Record<Uid, TemplateDescriptor> {
    const tree: Record<Uid, TemplateDescriptor> = {};

    const groups = group(Object.values(flattened), elem => elem.superType);
    groups.action.forEach(flatAction => {
      tree[flatAction.uid] = fromFlatActionTemplate(flatAction as FlatActionTemplate);
    });

    const choices: Record<Uid, ChoiceDescriptor> = {};
    groups.choice.forEach(flatChoice => {
      const parent = tree[flatChoice.parent];
      if (parent) {
        const c = fromFlatChoice(flatChoice as FlatChoice);
        choices[c.uid] = c;
        parent.choices.push(c);
      } else {
        scenarioEditionLogger.error('Found some orphan choice', flatChoice);
      }
    });

    const effects: Record<Uid, Effect> = {};
    groups.effect.forEach(flatEffect => {
      const parent = choices[flatEffect.parent];
      if (parent) {
        const ef = fromFlatEffect(flatEffect as FlatEffect);
        effects[ef.uid] = ef;
        parent.effects.push(ef);
      } else {
        scenarioEditionLogger.error('Found some orphan effect', flatEffect);
      }
    });

    groups.impact.forEach(flatImpact => {
      const parent = effects[flatImpact.parent];
      if (parent) {
        const i = fromFlatImpact(flatImpact as FlatImpact);
        parent.impacts.push(i);
      } else {
        scenarioEditionLogger.error('Found some orphan impact', flatImpact);
      }
    });

    return tree;
  }

  protected override createNewInternal(
    parentId: Uid,
    superType: MapToSuperTypeNames<ActionTemplateFlatType>
  ): ActionTemplateFlatType {
    switch (superType) {
      case 'action':
        return toFlatActionTemplate(
          getTemplateDef('FullyConfigurableTemplateDescriptor')!.getDefault(),
          ActionTemplateDataController.ACTION_ROOT
        );
      case 'choice':
        return toFlatChoice(getChoiceDefinition().getDefault(), parentId);
      case 'effect':
        return toFlatEffect(parentId);
      case 'impact':
        return toFlatImpact(getImpactDefinition('activation').getDefault(), parentId);
    }
  }
}

// TODO same for map entities
