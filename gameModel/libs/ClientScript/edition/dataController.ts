import { TemplateDescriptor } from '../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { IDescriptor, Indexed, Parented, SuperTyped, Typed, Uid } from '../game/common/interfaces';
import { Trigger } from '../game/common/triggers/trigger';
import { ObjectVariableClasses } from '../tools/helper';
import { parseObjectDescriptor, saveToObjectDescriptor } from '../tools/WegasHelper';
import { FlatChoice, getChoiceDefinition, toFlatChoice } from './typeDefinitions/choiceDefinition';
import {
  FlatCondition,
  fromFlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from './typeDefinitions/conditionDefinition';
import { MapToSuperTypeNames } from './typeDefinitions/definition';
import { FlatEffect, toFlatEffect } from './typeDefinitions/effectDefinition';
import {
  FlatImpact,
  fromFlatImpact,
  getImpactDefinition,
  toFlatImpact,
} from './typeDefinitions/impactDefinition';
import {
  FlatActionTemplate,
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

type FlatTypeDef = Typed & SuperTyped & IDescriptor & Indexed & Parented;

export abstract class DataControllerBase<
  DataType extends Typed,
  FlatType extends FlatTypeDef,
  IState
> {
  protected readonly undoRedo: UndoRedoContext<IState, FlatType>;
  private readonly varKey: keyof ObjectVariableClasses;

  constructor(variableKey: keyof ObjectVariableClasses, initialInferfaceState: IState) {
    this.varKey = variableKey;
    const desc = Variable.find(gameModel, variableKey);
    const data = parseObjectDescriptor<DataType>(desc) || {};
    this.undoRedo = new UndoRedoContext<IState, FlatType>(
      initialInferfaceState,
      this.flatten(data)
    );
  }

  /** Converts the original data to a flat structure */
  protected abstract flatten(input: Record<Uid, DataType>): Record<Uid, FlatType>;

  /**
   * Rebuilds a genuine object from a flat data representation
   */
  protected abstract recompose(flattened: Record<Uid, FlatType>): Record<Uid, DataType>;

  public save(): void {
    // Validation here ?
    const desc = Variable.find(gameModel, this.varKey);
    saveToObjectDescriptor(desc, this.recompose(this.undoRedo.getCurrentState()[1]));
    this.undoRedo.onSave();
  }

  public remove(id: Uid, interfaceState: IState): void {
    const flatData = this.getFlatDataClone();
    this.removeRecursively(id, flatData);
    // TODO recursively remove children
    this.refresh(interfaceState, flatData);
  }

  public createNew(
    parentId: Uid,
    type: MapToSuperTypeNames<FlatType>,
    interfaceState: IState
  ): FlatType {
    const newObject = this.createNewInternal(parentId, type);
    const updatedData = this.getFlatDataClone();
    updatedData[newObject.uid] = newObject;
    this.refresh(interfaceState, updatedData);
    return newObject;
  }

  protected abstract createNewInternal(
    parentId: Uid,
    type: MapToSuperTypeNames<FlatType>
  ): FlatType;

  private getFlatDataClone(): Record<Uid, FlatType> {
    return Helpers.cloneDeep(this.undoRedo.getCurrentState()[1]);
  }

  private refresh(interfaceState: IState, newData: Record<Uid, FlatType>): void {
    this.undoRedo.storeState(interfaceState, newData);
    // TODO inject interface ctx like in patient generation
    //const newState = Helpers.cloneDeep(interfaceState);
  }

  private removeRecursively(parentId: Uid, data: Record<Uid, FlatType>): void {
    const parentList: Uid[] = [parentId];
    let markedForRemoval: Uid[] = [parentId];
    while (parentList.length > 0) {
      const parent = parentList.pop();
      Object.entries(data)
        .filter(([_uid, obj]) => obj.parent === parent)
        .forEach(([uid, _obj]) => {
          markedForRemoval.push(uid);
          parentList.push(uid);
        });
      markedForRemoval.forEach(uid => delete data[uid]);
      markedForRemoval = [];
    }
  }
}

export type TriggerInterfaceState = {
  /* TODO in other file */
};

type TriggerFlatType = FlatTrigger | FlatImpact | FlatCondition;

export class TriggerDataController extends DataControllerBase<
  Trigger,
  TriggerFlatType,
  TriggerInterfaceState
> {
  private static readonly TRIGGER_ROOT: string = 'TRIGGER_ROOT';

  constructor(
    variableKey: keyof ObjectVariableClasses,
    initialInferfaceState: TriggerInterfaceState
  ) {
    super(variableKey, initialInferfaceState);
  }

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
        if(parentTrigger){
          if (element.superType === 'condition') {
            parentTrigger.conditions.push(fromFlatCondition(element));
          } else if (element.superType === 'impact') {
            parentTrigger.impacts.push(fromFlatImpact(element));
          }
        } else {
          // TODO warning message (orphan condition or impact)
        }
    });
    return tree;
  }

  public override createNewInternal(
    parentId: Uid,
    type: MapToSuperTypeNames<TriggerFlatType>
  ): TriggerFlatType {
    switch (type) {
      case 'trigger':
        return toFlatTrigger(getTriggerDefinition().getDefault(), parentId);
      case 'condition':
        return toFlatCondition(getConditionDefinition('time').getDefault(), parentId);
      case 'impact':
        return toFlatImpact(getImpactDefinition('activation').getDefault(), parentId);
    }
  }
}

export type ActionTemplateInterfaceState = {
  /* TODO in other file */
};

type ActionTemplateFlatType = FlatActionTemplate | FlatChoice | FlatEffect | FlatImpact;

export class ActionTemplateDataController extends DataControllerBase<
  TemplateDescriptor,
  ActionTemplateFlatType,
  ActionTemplateInterfaceState
> {
  protected override flatten(
    _input: Record<Uid, TemplateDescriptor>
  ): Record<Uid, ActionTemplateFlatType> {
    const flattened: Record<Uid, ActionTemplateFlatType> = {};
    /*
    TODO
    Object.entries(input).forEach(([uid, trigger]) => {
      flattened[uid] = toFlatTrigger(trigger, TriggerDataController.TRIGGER_ROOT);
      trigger.impacts.forEach(impact => {
        flattened[impact.uid] = toFlatImpact(impact, uid);
      });
      trigger.conditions.forEach(condition => {
        flattened[condition.uid] = toFlatCondition(condition, uid)
      })
    });*/
    return flattened;
  }

  protected override recompose(
    _flattened: Record<Uid, ActionTemplateFlatType>
  ): Record<Uid, TemplateDescriptor> {
    const tree: Record<Uid, TemplateDescriptor> = {};
    /** TODO
    Object.values(flattened)
      .filter(element => element.superType === 'trigger')
      .map(e => e as FlatTrigger) // safe cast
      .forEach((trigger : FlatTrigger) => {
        tree[trigger.uid] = fromFlatTrigger(trigger);
      });

    // fill in impacts and conditions
    Object.values(flattened)
      .forEach((element: TriggerFlatType) => {
        if(element.superType === 'condition'){
          tree[element.uid].conditions.push(fromFlatCondition(element));
        }else if(element.superType === 'impact'){
          tree[element.uid].impacts.push(fromFlatImpact(element));
        }
      })
      */
    return tree;
  }

  public override createNewInternal(
    parentId: Uid,
    type: MapToSuperTypeNames<ActionTemplateFlatType>
  ): ActionTemplateFlatType {
    switch (type) {
      case 'action':
        return toFlatActionTemplate(
          getTemplateDef('FullyConfigurableTemplateDescriptor')!.getDefault(),
          parentId
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
