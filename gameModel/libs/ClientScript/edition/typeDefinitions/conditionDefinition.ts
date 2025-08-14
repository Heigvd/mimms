import { Condition } from '../../game/common/triggers/condition';
import { TimeCondition } from '../../game/common/triggers/implementation/timeCondition';
import { generateId } from '../../tools/helper';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  MapToTypeNames,
  ValidationResult,
} from './definition';

type ConditionTypeName = MapToTypeNames<Condition>;
export type ConditionDefinition = MapToDefinition<Condition>;

export function getConditionDefinition(type: ConditionTypeName): ConditionDefinition {
  // TODO complete all definitions
  const defs: Record<ConditionTypeName, ConditionDefinition> = {
    time: getTimeConditionDef(),
    action: {} as any,
    choice: {} as any,
    trigger: {} as any,
    mapEntity: {} as any,
  };

  return defs[type]!;
}

// TODO complete with all other condition types

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
