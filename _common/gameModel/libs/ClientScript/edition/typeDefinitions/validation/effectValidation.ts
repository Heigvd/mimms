import { Effect } from '../../../game/common/impacts/effect';
import { Impact } from '../../../game/common/impacts/impact';
import { getImpactDefinition } from '../impactDefinition';
import { ActionValidationContext, ActionValidationMessage } from './validationContext';

export function effectValidator(
  effect: Effect,
  ctx: ActionValidationContext
): ActionValidationMessage[] {
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.effect = effect.uid;

  const result: ActionValidationMessage[] = [];

  if (effect.impacts.filter(i => i.type === 'feedback').length > 1) {
    result.push({
      id: 'several-feedbacks-effect-' + effect.uid,
      level: 'WARNING',
      title: 'Several feedbacks on one effect',
      description:
        'An effect defines more than one feedback.<br/>Only the last one evaluated will be kept.',
      validationContext: extendedCtx,
    });
  }

  effect.impacts.forEach((impact: Impact): void => {
    const validator = getImpactDefinition(impact.type).validator as (
      value: Impact,
      ctx: ActionValidationContext
    ) => ActionValidationMessage[];
    result.push(...validator(impact, extendedCtx));
  });

  return result;
}
