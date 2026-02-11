import { Impact } from '../../../game/common/impacts/impact';
import { Condition } from '../../../game/common/triggers/condition';
import { Trigger } from '../../../game/common/triggers/trigger';
import { getConditionDefinition } from '../conditionDefinition';
import { getImpactDefinition } from '../impactDefinition';
import { TriggerValidationContext, TriggerValidationMessage } from './validationContext';

export function triggerValidator(
  trigger: Trigger,
  ctx: TriggerValidationContext
): TriggerValidationMessage[] {
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.trigger = trigger.uid;

  const result: TriggerValidationMessage[] = [];

  trigger.conditions.forEach((condition: Condition): void => {
    const validator = getConditionDefinition(condition.type).validator as (
      value: Condition,
      ctx: TriggerValidationContext
    ) => TriggerValidationMessage[];
    result.push(...validator(condition, extendedCtx));
  });

  trigger.impacts.forEach((impact: Impact): void => {
    const validator = getImpactDefinition(impact.type).validator as (
      value: Impact,
      ctx: TriggerValidationContext
    ) => TriggerValidationMessage[];
    result.push(...validator(impact, extendedCtx));
  });

  return result;
}
