import { Condition } from '../../game/common/triggers/condition';
import { TimeCondition } from '../../game/common/triggers/implementation/timeCondition';
import { generateId } from '../../tools/helper';
import { ALL_EDITABLE, Definition, MapToDefinition, MapToTypeNames } from './definition';

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
    validator: _condition => ({ success: true, messages: [] }),
    getDefault: () => ({
      uid: generateId(10),
      index: 1,
      type: 'time',
      operator: '=',
      timeSeconds: 0,
    }),
    view: {
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      type: ALL_EDITABLE,
      operator: ALL_EDITABLE,
      timeSeconds: ALL_EDITABLE,
    },
  };
}
