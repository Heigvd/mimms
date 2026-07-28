import { Trigger } from '../../game/common/triggers/trigger';
import { TriggerConfigUIState } from '../UIfacade/triggerConfigFacade';
import { TriggerValidationContext } from '../typeDefinitions/validation/validationContext';
import { Uid } from '../../game/common/interfaces';
import {
  FlatTrigger,
  fromFlatTrigger,
  getTriggerDefinition,
  toFlatTrigger,
} from '../typeDefinitions/triggerDefinition';
import {
  fromFlatImpact,
  getImpactDefinition,
  toFlatImpact,
} from '../typeDefinitions/impactDefinition';
import {
  fromFlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../typeDefinitions/conditionDefinition';
import { scenarioEditionLogger } from '../../tools/logger';
import { getChildren } from './parentedUtils';
import { ValidationMessage } from '../typeDefinitions/definition';
import { getInitialTriggerUIState } from './controllerInstances';
import {
  CreationOptionsBase,
  DataControllerBase,
  SuperTypeNames,
  TriggerFlatType,
} from './dataControllerBase';

export class TriggerDataController extends DataControllerBase<
  Trigger,
  TriggerFlatType,
  TriggerConfigUIState,
  CreationOptionsBase,
  TriggerValidationContext
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
          if (element.superType === 'condition' && element.type !== 'empty') {
            parentTrigger.conditions.push(fromFlatCondition(element));
          } else if (element.superType === 'impact' && element.type !== 'empty') {
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
    superType: TriggerFlatType['superType'],
    options: CreationOptionsBase
  ): TriggerFlatType {
    switch (superType) {
      case 'trigger': {
        const trigger = toFlatTrigger(
          getTriggerDefinition().getDefault(),
          TriggerDataController.TRIGGER_ROOT
        );
        this.assignNewTagName(trigger);
        return trigger;
      }
      case 'condition':
        return toFlatCondition(getConditionDefinition('empty').getDefault(), parentId);
      case 'impact':
        return toFlatImpact(
          getImpactDefinition('empty', options.parentType).getDefault(),
          parentId
        );
    }
  }

  private assignNewTagName(newObject: FlatTrigger): void {
    // fetch the already existing siblings
    const siblings = getChildren(newObject.parent, this.getFlatData());
    let candidate = newObject.tag;
    let i = 2;
    while (
      Object.values(siblings).some(obj => obj.superType === 'trigger' && obj.tag === candidate)
    ) {
      candidate = newObject.tag + ' ' + i;
      i++;
    }
    newObject.tag = candidate;
  }

  protected validateInternal(value: Trigger): ValidationMessage<TriggerValidationContext>[] {
    return getTriggerDefinition().validator(value, {
      page: 'triggers',
      targetState: getInitialTriggerUIState(),
    });
  }

  protected override isSibling(target: TriggerFlatType, candidate: TriggerFlatType): boolean {
    if (target.type === 'trigger' && candidate.type === 'trigger') {
      const t = target as FlatTrigger;
      const c = candidate as FlatTrigger;
      return t.mandatory === c.mandatory;
    }
    return true;
  }

  public override unselect(itemType: SuperTypeNames): void {
    switch (itemType) {
      case 'trigger':
        super.unselect(itemType);
        super.unselect('condition');
        super.unselect('impact');
        break;
      default:
        super.unselect(itemType);
    }
  }
}
