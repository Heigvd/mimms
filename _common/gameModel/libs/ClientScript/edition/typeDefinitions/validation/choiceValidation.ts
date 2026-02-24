import { ChoiceDescriptor } from '../../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { Effect } from '../../../game/common/impacts/effect';
import {
  getActionTemplateController,
  getMapEntityController,
} from '../../controllers/controllerInstances';
import { getEffectDefinition } from '../effectDefinition';
import { FlatActionTemplate } from '../templateDefinition';
import { ActionValidationContext, ActionValidationMessage } from './validationContext';

export function choiceDescriptorValidator(
  choice: ChoiceDescriptor,
  ctx: ActionValidationContext
): ActionValidationMessage[] {
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.choice = choice.uid;

  const result: ActionValidationMessage[] = [];

  let action: Readonly<FlatActionTemplate> | undefined;
  // Note : Could be fetched more robustly
  const actionUid = extendedCtx.targetState.selected.action;
  if (actionUid) {
    action = getActionTemplateController().getItem<FlatActionTemplate>(actionUid, 'action');
  }

  if (
    choice.displayedMapEntity &&
    getMapEntityController().getItem(choice.displayedMapEntity, 'mapEntity') == undefined
  ) {
    result.push({
      id: 'map-entity-broken-target-choice-' + choice.uid,
      level: 'ERROR',
      title: 'Invalid choice target',
      description: `Choice "${choice.tag}" of action "${action?.tag}" references a location that no longer exists.<br/>The target marker associated with this choice could not be found.`,
      validationContext: extendedCtx,
    });
  }

  // Note : cannot happen through the scenario edition interface
  if (
    action &&
    action.type === 'MapChoiceActionTemplateDescriptor' &&
    choice.displayedMapEntity?.length == 0
  ) {
    result.push({
      id: 'basic-action-map-entity-missing-choice-' + choice.uid,
      level: 'ERROR',
      title: `Location missing for choice "${choice.tag}" of action "${action?.tag}"`,
      description: `A basic action choice must be associated with a location.<br/>Please select a valid location for this choice.`,
      validationContext: extendedCtx,
    });
  }

  choice.effects.forEach((effect: Effect): void => {
    result.push(...getEffectDefinition().validator(effect, extendedCtx));
  });

  return result;
}
