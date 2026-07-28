// EVALUATION_PRIORITY 0

import { Impact } from '../../game/common/impacts/impact';
import {
  ActivationImpact,
  MapActivationImpact,
} from '../../game/common/impacts/implementation/activationImpact';
import { ChoiceEffectSelectionImpact } from '../../game/common/impacts/implementation/choiceEffectSelectionImpact';
import { EmptyImpact } from '../../game/common/impacts/implementation/emptyImpact';
import { NotificationMessageImpact } from '../../game/common/impacts/implementation/notificationImpact';
import { RadioMessageImpact } from '../../game/common/impacts/implementation/radioImpact';
import { Uid } from '../../game/common/interfaces';
import { RadioType } from '../../game/common/radio/communicationType';
import { generateId } from '../../tools/helper';
import { scenarioEditionLogger } from '../../tools/logger';
import { createOrUpdateTranslation } from '../../tools/translation';
import { SuperTypeNames } from '../controllers/dataControllerBase';
import { ALL_EDITABLE, Definition, MapToDefinition, MapToFlatType } from './definition';
import {
  activationImpactValidator,
  choiceEffectValidator,
  emptyImpactValidator,
  mapActivationImpactValidator,
  notificationMessageImpactValidator,
  radioMessageImpactValidator,
} from './validation/impactValidation';
import { ActionValidationContext, TriggerValidationContext } from './validation/validationContext';

type ImpactTypeName = Impact['type'];
type ImpactValidationContext = TriggerValidationContext | ActionValidationContext;
type ImpactDefinition = MapToDefinition<Impact, ImpactValidationContext>;
export type FlatImpact = MapToFlatType<Impact, 'impact'>;

export function toFlatImpact(imp: Impact, parentId: Uid): FlatImpact {
  return {
    ...imp,
    parent: parentId,
    superType: 'impact',
  };
}

export function fromFlatImpact(fimp: FlatImpact): Impact {
  const { superType: _ignored, parent: _ignore, ...impact } = fimp;
  return impact;
}

export function getImpactDefinition(
  type: ImpactTypeName,
  parentType?: SuperTypeNames
): ImpactDefinition {
  let definition: ImpactDefinition;
  switch (type) {
    case 'activation':
      definition = getActivationImpactDef();
      break;
    case 'mapActivation':
      definition = getMapActivationImpactDef();
      break;
    case 'effectSelection':
      definition = getChoiceEffectSelectionImpactDef();
      break;
    case 'notification':
      definition = getNotificationImpactDef(parentType);
      break;
    case 'radio':
      definition = getRadioImpactDef();
      break;
    case 'empty':
      definition = getEmptyImpactDef();
      break;
  }

  if (definition?.type !== type) {
    scenarioEditionLogger.error('Could not provide a type definition for type', type);
  }

  return definition;
}

// TODO check all of that when the display is implemented

// TODO somewhere check that all impacts are valid

export function getEmptyImpactDef(): Definition<EmptyImpact, ImpactValidationContext> {
  return {
    type: 'empty',
    getDefault: () => ({
      type: 'empty',
      uid: generateId(10),
      index: 0,
    }),
    validator: emptyImpactValidator,
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
    },
  };
}

export function getActivationImpactDef(): Definition<ActivationImpact, ImpactValidationContext> {
  return {
    type: 'activation',
    getDefault: () => ({
      type: 'activation',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      activableType: undefined,
      target: '',
      option: 'activate',
    }),
    validator: activationImpactValidator,
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      activableType: ALL_EDITABLE,
      target: ALL_EDITABLE,
      option: ALL_EDITABLE,
    },
  };
}

export function getChoiceEffectSelectionImpactDef(): Definition<
  ChoiceEffectSelectionImpact,
  ImpactValidationContext
> {
  return {
    type: 'effectSelection',
    getDefault: () => ({
      type: 'effectSelection',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      target: '',
      targetEffect: '',
    }),
    validator: choiceEffectValidator,
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      target: ALL_EDITABLE,
      targetEffect: ALL_EDITABLE,
    },
  };
}

export function getNotificationImpactDef(
  parentType?: SuperTypeNames
): Definition<NotificationMessageImpact, ImpactValidationContext> {
  return {
    type: 'notification',
    getDefault: () => ({
      type: 'notification',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      message: createOrUpdateTranslation('', undefined),
      roles: {
        ACS: false,
        MCS: false,
        AL: false,
        CASU: false,
        EVASAN: false,
        Initiator: parentType === 'effect' ? true : false,
      },
    }),
    validator: notificationMessageImpactValidator,
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      roles: {} as any, // TODO ALL_EDITABLE,
    },
  };
}

export function getRadioImpactDef(): Definition<RadioMessageImpact, ImpactValidationContext> {
  return {
    type: 'radio',
    getDefault: () => ({
      type: 'radio',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      message: createOrUpdateTranslation('', undefined),
      channel: RadioType.CASU,
    }),
    validator: radioMessageImpactValidator,
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      channel: ALL_EDITABLE,
    },
  };
}

export function getMapActivationImpactDef(): Definition<
  MapActivationImpact,
  ImpactValidationContext
> {
  return {
    type: 'mapActivation',
    getDefault: () => ({
      type: 'mapActivation',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      activableType: 'mapEntity',
      target: '',
      option: 'activate',
      buildStatus: 'pending',
    }),
    validator: mapActivationImpactValidator,
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'hidden', expert: 'visible' },
      index: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      option: ALL_EDITABLE,
      target: ALL_EDITABLE,
      buildStatus: ALL_EDITABLE,
    },
  };
}
