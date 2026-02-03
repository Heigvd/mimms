import { FullyConfigurableTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { MapChoiceActionTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/mapChoiceTemplate';
import { MoveActorTemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/descriptors/moveTemplate';
import { ITemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { getFilteredAsArray } from '../../../tools/helper';
import { getChoiceDefinition } from '../choiceDefinition';
import { ActionValidationContext, ActionValidationMessage } from './validationContext';

export function moveActionTemplateValidator(
  actionTemplate: MoveActorTemplateDescriptor,
  ctx: ActionValidationContext
): ActionValidationMessage[] {
  return commonActionTemplateValidator(actionTemplate, ctx);
}

export function mapChoiceActionTemplateValidator(
  actionTemplate: MapChoiceActionTemplateDescriptor,
  ctx: ActionValidationContext
): ActionValidationMessage[] {
  return commonActionTemplateValidator(actionTemplate, ctx);
}

export function fullyConfigurableActionTemplateValidator(
  actionTemplate: FullyConfigurableTemplateDescriptor,
  ctx: ActionValidationContext
): ActionValidationMessage[] {
  return commonActionTemplateValidator(actionTemplate, ctx);
}

function commonActionTemplateValidator(
  actionTemplate: ITemplateDescriptor,
  ctx: ActionValidationContext
): ActionValidationMessage[] {
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.action = actionTemplate.uid;

  const result: ActionValidationMessage[] = [];

  if (actionTemplate.mandatory && getFilteredAsArray(actionTemplate.availableToRoles).length < 1) {
    result.push({
      id: 'no-actor-basic-action-template-' + actionTemplate.uid,
      level: 'ERROR',
      title: `No actor selected on "${actionTemplate.tag}"`,
      description:
        'A basic action must be associated with an actor.<br/>Without an actor, the action cannot be executed during the simulation.',
      validationContext: extendedCtx,
    });
  }

  actionTemplate.choices.forEach((choice: ChoiceDescriptor): void => {
    result.push(...getChoiceDefinition().validator(choice, extendedCtx));
  });

  return result;
}
