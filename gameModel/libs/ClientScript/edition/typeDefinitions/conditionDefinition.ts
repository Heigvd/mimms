// EVALUATION_PRIORITY 0

import { ANY_CHOICE } from '../../game/common/constants';
import { Uid } from '../../game/common/interfaces';
import { Condition } from '../../game/common/triggers/condition';
import { ActionCondition } from '../../game/common/triggers/implementation/actionCondition';
import {
  MapEntityCondition,
  TriggerCondition,
} from '../../game/common/triggers/implementation/activableCondition';
import { EmptyCondition } from '../../game/common/triggers/implementation/emptyCondition';
import { TimeCondition } from '../../game/common/triggers/implementation/timeCondition';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition, MapToDefinition, MapToFlatType } from './definition';
import {
  actionConditionValidator,
  emptyConditionValidator,
  mapEntityConditionValidator,
  timeConditionValidator,
  triggerConditionValidator,
} from './validation/conditionValidation';
import { TriggerValidationContext } from './validation/validationContext';

type ConditionTypeName = Condition['type'];

export type ConditionDefinition = MapToDefinition<Condition, TriggerValidationContext>;
export type FlatCondition = MapToFlatType<Condition, 'condition'>;

export function toFlatCondition(cond: Condition, parentId: Uid): FlatCondition {
  return {
    ...cond,
    parent: parentId,
    superType: 'condition',
  };
}

export function fromFlatCondition(fcond: FlatCondition): Condition {
  const { superType: _ignored, parent: _ignore, ...condition } = fcond;
  return condition;
}

export function getConditionDefinition(type: ConditionTypeName): ConditionDefinition {
  const defs: Record<ConditionTypeName, ConditionDefinition> = {
    time: getTimeConditionDef(),
    action: getActionConditionDef(),
    trigger: getTriggerConditionDef(),
    mapEntity: getMapEntityConditionDef(),
    empty: getEmptyConditionDef(),
  };

  return defs[type]!;
}

export function getEmptyConditionDef(): Definition<EmptyCondition, TriggerValidationContext> {
  return {
    type: 'empty',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'empty',
    }),
    validator: emptyConditionValidator,
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
    },
  };
}

export function getTimeConditionDef(): Definition<TimeCondition, TriggerValidationContext> {
  return {
    type: 'time',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'time',
      operator: '=',
      timeSeconds: 0,
    }),
    validator: timeConditionValidator,
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      timeSeconds: ALL_EDITABLE,
    },
  };
}

export function getActionConditionDef(): Definition<ActionCondition, TriggerValidationContext> {
  return {
    type: 'action',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'action',
      actionRef: '',
      choiceRef: ANY_CHOICE,
      status: 'active',
    }),
    validator: actionConditionValidator,
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      actionRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
      choiceRef: ALL_EDITABLE,
    },
  };
}

export function getTriggerConditionDef(): Definition<TriggerCondition, TriggerValidationContext> {
  return {
    type: 'trigger',
    getDefault: () => ({
      type: 'trigger',
      uid: generateId(10),
      index: 0,
      activableRef: '',
      status: 'active',
    }),
    validator: triggerConditionValidator,
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      activableRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
    },
  };
}

export function getMapEntityConditionDef(): Definition<
  MapEntityCondition,
  TriggerValidationContext
> {
  return {
    type: 'mapEntity',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'mapEntity',
      activableRef: '',
      status: 'active',
    }),
    validator: mapEntityConditionValidator,
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      activableRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
    },
  };
}
