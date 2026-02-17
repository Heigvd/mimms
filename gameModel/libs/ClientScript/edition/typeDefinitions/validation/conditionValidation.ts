import { ANY_CHOICE, OneMinuteDuration } from '../../../game/common/constants';
import { ActionCondition } from '../../../game/common/triggers/implementation/actionCondition';
import {
  MapEntityCondition,
  TriggerCondition,
} from '../../../game/common/triggers/implementation/activableCondition';
import { EmptyCondition } from '../../../game/common/triggers/implementation/emptyCondition';
import { TimeCondition } from '../../../game/common/triggers/implementation/timeCondition';
import {
  getActionTemplateController,
  getMapEntityController,
  getTriggerController,
} from '../../controllers/controllerInstances';
import { FlatTrigger } from '../triggerDefinition';
import { TriggerValidationContext, TriggerValidationMessage } from './validationContext';

export function emptyConditionValidator(
  _condition: EmptyCondition,
  _ctx: TriggerValidationContext
): TriggerValidationMessage[] {
  return [];
}

export function timeConditionValidator(
  condition: TimeCondition,
  ctx: TriggerValidationContext
): TriggerValidationMessage[] {
  const result: TriggerValidationMessage[] = [];
  const operator = condition.operator;
  if (condition.zeroTimeRef === 'incident' && (operator === '<' || operator === '=')) {
    const arrivalDelay = Variable.find(gameModel, 'patients-elapsed-minutes').getValue(self);

    if (arrivalDelay * OneMinuteDuration > condition.timeSeconds) {
      const extendedCtx = Helpers.cloneDeep(ctx);
      extendedCtx.targetState.selected.condition = condition.uid;
      const triggerUid = ctx.targetState.selected.trigger || '';
      const triggerName =
        getTriggerController().getItem<FlatTrigger>(triggerUid, 'trigger')?.tag || 'Unamed trigger';
      result.push({
        id: 'time-before-start-condition-' + condition.uid,
        level: 'WARNING',
        title: 'Condition with invalid time',
        description: `Condition of trigger "${triggerName}" has a time condition (${
          condition.operator
        } ${
          condition.timeSeconds / 60
        } min after incident) that happens earlier than simulation start.<br/>This condition will never trigger.`,
        validationContext: extendedCtx,
      });
    }
  }
  return result;
}

export function actionConditionValidator(
  condition: ActionCondition,
  ctx: TriggerValidationContext
): TriggerValidationMessage[] {
  const result: TriggerValidationMessage[] = [];
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.condition = condition.uid;

  let triggerName: string = '';
  // Note : Could be fetched more robustly
  const triggerUid = extendedCtx.targetState.selected.trigger;
  if (triggerUid) {
    triggerName = getTriggerController().getItem<FlatTrigger>(triggerUid, 'trigger')?.tag || '';
  }

  if (
    condition.actionRef &&
    getActionTemplateController().getItem(condition.actionRef, 'action') == undefined
  ) {
    result.push({
      id: 'action-broken-target-condition-' + condition.uid,
      level: 'ERROR',
      title: 'Condition with invalid target',
      description: `Condition of trigger "${triggerName}" references an entity that no longer exists.<br/>The condition cannot be evaluated correctly.`,
      validationContext: extendedCtx,
    });
  } else if (
    condition.choiceRef &&
    condition.choiceRef !== ANY_CHOICE &&
    getActionTemplateController().getItem(condition.choiceRef, 'choice') == undefined
  ) {
    result.push({
      id: 'choice-broken-target-condition-' + condition.uid,
      level: 'ERROR',
      title: 'Condition with invalid target',
      description: `Condition of trigger "${triggerName}" references an entity that no longer exists.<br/>The condition cannot be evaluated correctly.`,
      validationContext: extendedCtx,
    });
  }

  return result;
}

export function triggerConditionValidator(
  condition: TriggerCondition,
  ctx: TriggerValidationContext
): TriggerValidationMessage[] {
  const result: TriggerValidationMessage[] = [];
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.condition = condition.uid;

  let triggerName: string = '';
  // Note : Could be fetched more robustly
  const triggerUid = extendedCtx.targetState.selected.trigger;
  if (triggerUid) {
    triggerName = getTriggerController().getItem<FlatTrigger>(triggerUid, 'trigger')?.tag || '';
  }

  if (
    condition.activableRef &&
    getTriggerController().getItem(condition.activableRef, 'trigger') == undefined
  ) {
    result.push({
      id: 'trigger-broken-target-condition-' + condition.uid,
      level: 'ERROR',
      title: 'Condition with invalid target',
      description: `Condition of trigger "${triggerName}" references an entity that no longer exists.<br/>The condition cannot be evaluated correctly.`,
      validationContext: extendedCtx,
    });
  }

  return result;
}

export function mapEntityConditionValidator(
  condition: MapEntityCondition,
  ctx: TriggerValidationContext
): TriggerValidationMessage[] {
  const result: TriggerValidationMessage[] = [];
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.condition = condition.uid;

  let triggerName: string = '';
  // Note : Could be fetched more robustly
  const triggerUid = extendedCtx.targetState.selected.trigger;
  if (triggerUid) {
    triggerName = getTriggerController().getItem<FlatTrigger>(triggerUid, 'trigger')?.tag || '';
  }

  if (
    condition.activableRef &&
    getMapEntityController().getItem(condition.activableRef, 'mapEntity') == undefined
  ) {
    result.push({
      id: 'map-entity-broken-target-condition-' + condition.uid,
      level: 'ERROR',
      title: 'Condition with invalid target',
      description: `Condition of trigger "${triggerName}" references an entity that no longer exists.<br/>The condition cannot be evaluated correctly.`,
      validationContext: extendedCtx,
    });
  }

  return result;
}
