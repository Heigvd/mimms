import {
  ActivationImpact,
  MapActivationImpact,
} from '../../../game/common/impacts/implementation/activationImpact';
import { ChoiceEffectSelectionImpact } from '../../../game/common/impacts/implementation/choiceEffectSelectionImpact';
import { EmptyImpact } from '../../../game/common/impacts/implementation/emptyImpact';
import { NotificationMessageImpact } from '../../../game/common/impacts/implementation/notificationImpact';
import { RadioMessageImpact } from '../../../game/common/impacts/implementation/radioImpact';
import { LOCATION_ENUM } from '../../../game/common/simulationState/locationState';
import { getFlatObjects } from '../../UIfacade/genericConfigFacade';
import {
  getActionTemplateController,
  getMapEntityController,
} from '../../controllers/controllerInstances';
import { ValidationMessage } from '../definition';
import { FlatMapEntity } from '../mapEntityDefinition';
import { ActionValidationContext, TriggerValidationContext } from './validationContext';

type ImpactValidationMessage = ValidationMessage<
  ActionValidationContext | TriggerValidationContext
>;

export function emptyImpactValidator(
  _impact: EmptyImpact,
  _ctx: ActionValidationContext | TriggerValidationContext
): ImpactValidationMessage[] {
  return [];
}

export function activationImpactValidator(
  impact: ActivationImpact,
  ctx: ActionValidationContext | TriggerValidationContext
): ImpactValidationMessage[] {
  const result: ImpactValidationMessage[] = [];
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.impact = impact.uid;

  if (impact.target && getFlatObjects()[impact.target] == undefined) {
    result.push({
      id: 'activable-broken-target-impact-' + impact.uid,
      level: 'ERROR',
      title: 'Invalid impact target',
      description:
        'An impact references an entity that no longer exists or is incorrect.<br/>Activation or deactivation cannot be applied to this target.',
      validationContext: extendedCtx,
    });
  }

  return result;
}

export function choiceEffectValidator(
  impact: ChoiceEffectSelectionImpact,
  ctx: ActionValidationContext | TriggerValidationContext
): ImpactValidationMessage[] {
  const result: ImpactValidationMessage[] = [];
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.impact = impact.uid;

  if (
    impact.target &&
    getActionTemplateController().getItem(impact.target, 'choice') == undefined
  ) {
    result.push({
      id: 'choice-effect-broken-impact-' + impact.uid,
      level: 'ERROR',
      title: 'Invalid impact target',
      description:
        'An impact references an entity that no longer exists or is incorrect.<br/>Set effect cannot be applied to this target.',
      validationContext: extendedCtx,
    });
  }

  return result;
}

export function notificationMessageImpactValidator(
  _impact: NotificationMessageImpact,
  _ctx: ActionValidationContext | TriggerValidationContext
): ImpactValidationMessage[] {
  return [];
}

export function radioMessageImpactValidator(
  _impact: RadioMessageImpact,
  _ctx: ActionValidationContext | TriggerValidationContext
): ImpactValidationMessage[] {
  return [];
}

export function mapActivationImpactValidator(
  impact: MapActivationImpact,
  ctx: ActionValidationContext | TriggerValidationContext
): ImpactValidationMessage[] {
  const result: ImpactValidationMessage[] = [];
  const extendedCtx = Helpers.cloneDeep(ctx);
  extendedCtx.targetState.selected.impact = impact.uid;

  if (impact.target) {
    const mapEntity = getMapEntityController().getItem<FlatMapEntity>(impact.target, 'mapEntity');
    if (mapEntity == undefined) {
      result.push({
        id: 'map-activable-broken-target-impact-' + impact.uid,
        level: 'ERROR',
        title: 'Invalid impact target',
        description:
          'An impact references an entity that no longer exists or is incorrect.<br/>Activation or deactivation cannot be applied to this target.',
        validationContext: extendedCtx,
      });
    } else {
      if (mapEntity.binding !== LOCATION_ENUM.custom) {
        result.push({
          id: 'on-basic-location-impact-' + impact.uid,
          level: 'ERROR',
          title: 'Impact applied to a basic location',
          description:
            'Basic locations cannot be modified by an impact.<br/>Please select a compatible location or modify the impact logic.',
          validationContext: extendedCtx,
        });
      }
    }
  }

  return result;
}

/*
// bout de code pour d'éventuels références

  let parentName: string = '';
  if (extendedCtx.targetState.selected.trigger) {
    // Note : Could be fetched more robustly
    const triggerUid: string = extendedCtx.targetState.selected.trigger;
    parentName =
      getTriggerController().getItem<FlatTrigger>(triggerUid, 'trigger')?.tag || '';
  } else if (extendedCtx.targetState.selected.action) {
    // Note : Could be fetched more robustly
    const actionUid: string = extendedCtx.targetState.selected.action;
    parentName =
      getActionTemplateController().getItem<FlatActionTemplate>(actionUid, 'action')?.tag || '';
  }
*/

/*
// bouts de code pour d'éventuels warnings

  if (impact.delaySeconds < 0) { }

  if (checkIsMessageEmpty(impact.message)) { }

  const hasSomeRoleSelected = Object.values(impact.roles).some(selection => selection);
  if (!hasSomeRoleSelected) { }

function checkIsMessageEmpty(message: ITranslatableContent | undefined): boolean {
  return (
    message == undefined ||
    Object.values(message.translations).every(
      (transl: ITranslation) => transl?.translation?.trim().length === 0
    )
  );
}
 */
