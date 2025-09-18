import { Uid } from '../../game/common/interfaces';
import { Condition } from '../../game/common/triggers/condition';
import { ActionCondition } from '../../game/common/triggers/implementation/actionCondition';
import {
  MapEntityCondition,
  TriggerCondition,
} from '../../game/common/triggers/implementation/activableCondition';
import { ChoiceCondition } from '../../game/common/triggers/implementation/choiceCondition';
import { EmptyCondition } from '../../game/common/triggers/implementation/emptyCondition';
import { TimeCondition } from '../../game/common/triggers/implementation/timeCondition';
import { generateId } from '../../tools/helper';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  MapToFlatType,
  ValidationResult,
} from './definition';

type ConditionTypeName = Condition['type'];

export type ConditionDefinition = MapToDefinition<Condition>;
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
    choice: getChoiceConditionDef(),
    trigger: getTriggerConditionDef(),
    mapEntity: getMapEntityConditionDef(),
    empty: getEmptyConditionDef(),
  };

  return defs[type]!;
}

function getEmptyConditionDef(): Definition<EmptyCondition> {
  return {
    type: 'empty',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'empty',
    }),
    validator: (_condition: EmptyCondition) => ({ success: true, messages: [] }),
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
    },
  };
}

// TODO check all of that when the display is implemented

// TODO somewhere check that all impacts are valid

function getTimeConditionDef(): Definition<TimeCondition> {
  return {
    type: 'time',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'time',
      operator: '=',
      timeSeconds: 0,
    }),
    validator: (condition: TimeCondition) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (condition.timeSeconds < 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'The time cannot be negative',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      timeSeconds: ALL_EDITABLE,
    },
  };
}

function getActionConditionDef(): Definition<ActionCondition> {
  return {
    type: 'action',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'action',
      actionRef: 0,
      status: 'active',
    }),
    validator: (condition: ActionCondition) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (condition.actionRef === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select the action',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      actionRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
    },
  };
}

function getChoiceConditionDef(): Definition<ChoiceCondition> {
  return {
    type: 'choice',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'choice',
      choiceRef: '',
      actionRef: 0,
      status: 'active',
    }),
    validator: (condition: ChoiceCondition) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (condition.choiceRef.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select the choice',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      choiceRef: ALL_EDITABLE,
      actionRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
    },
  };
}

function getTriggerConditionDef(): Definition<TriggerCondition> {
  return {
    type: 'trigger',
    getDefault: () => ({
      type: 'trigger',
      uid: generateId(10),
      index: 0,
      activableRef: '',
      status: 'active',
    }),
    validator: (condition: TriggerCondition) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (condition.activableRef.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select a trigger',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      activableRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
    },
  };
}

function getMapEntityConditionDef(): Definition<MapEntityCondition> {
  return {
    type: 'mapEntity',
    getDefault: () => ({
      uid: generateId(10),
      index: 0,
      type: 'mapEntity',
      activableRef: '',
      status: 'active',
    }),
    validator: (condition: MapEntityCondition) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (condition.activableRef.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select a trigger',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      activableRef: ALL_EDITABLE,
      status: ALL_EDITABLE,
    },
  };
}
