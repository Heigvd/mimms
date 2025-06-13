import { Condition } from '../../game/common/triggers/condition';
import { TimeCondition } from '../../game/common/triggers/implementation/timeCondition';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  MapToTypeNames,
} from '../typeDefinitions/definition';

type ConditionTypeName = MapToTypeNames<Condition>;
export type ConditionDefinition = MapToDefinition<Condition>;

export function getConditionDefinition(type: ConditionTypeName): ConditionDefinition {
  // TODO complete all definitions
  const defs: Record<ConditionTypeName, ConditionDefinition> = {
    Time: getTimeConditionDef(),
    Action: {} as any,
    Choice: {} as any,
    Trigger: {} as any,
  };

  return defs[type]!;
}

// TODO complete with all condition types

function getTimeConditionDef(): Definition<TimeCondition> {
  return {
    type: 'Time',
    validator: _condition => ({ success: true, messages: [] }),
    getDefault: () => ({
      type: 'Time',
      operator: '=',
      timeSeconds: 0,
    }),
    view: {
      type: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      timeSeconds: ALL_EDITABLE,
    },
  };
}
