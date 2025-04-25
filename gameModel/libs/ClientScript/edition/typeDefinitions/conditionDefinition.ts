import { Condition } from '../../game/common/triggers/condition';
import { MapToDefinition, MapToTypeNames } from '../typeDefinitions/definition';

type ConditionTypeName = MapToTypeNames<Condition>;
export type ConditionDefinition = MapToDefinition<Condition>;

export function getConditionDefinition(type: ConditionTypeName): ConditionDefinition {
  // TODO should not be partial and give all definitions
  const defs: Partial<Record<ConditionTypeName, ConditionDefinition>> = {};

  return defs[type]!;
}

// TODO complete with all condition types, see impacts
