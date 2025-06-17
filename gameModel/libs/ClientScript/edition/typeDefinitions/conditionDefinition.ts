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
    time: getTimeConditionDef(),
    action: {} as any,
    choice: {} as any,
    trigger: {} as any,
  };

  return defs[type]!;
}

// TODO complete with all other condition types

function getTimeConditionDef(): Definition<TimeCondition> {
  return {
    type: 'time',
    validator: _condition => ({ success: true, messages: [] }),
    getDefault: () => ({
      type: 'time',
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
