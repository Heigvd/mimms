// EVALUATION_PRIORITY 0

import { Impact } from '../../game/common/impacts/impact';
import { ChoiceEffectSelectionImpact } from '../../game/common/impacts/implementation/choiceEffectSelectionImpact';
import { EmptyImpact } from '../../game/common/impacts/implementation/emptyImpact';
import { NotificationMessageImpact } from '../../game/common/impacts/implementation/notificationImpact';
import { RadioMessageImpact } from '../../game/common/impacts/implementation/radioImpact';
import { Uid } from '../../game/common/interfaces';
import { RadioType } from '../../game/common/radio/communicationType';
import { generateId } from '../../tools/helper';
import { createOrUpdateTranslation } from '../../tools/translation';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  MapToFlatType,
  ValidationResult,
} from './definition';
import {
  ActivationImpact,
  MapActivationImpact,
} from '../../game/common/impacts/implementation/activationImpact';


type ImpactTypeName = Impact['type'];
type ImpactDefinition = MapToDefinition<Impact>;
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

export function getImpactDefinition(type: ImpactTypeName): ImpactDefinition {
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
      definition = getNotificationImpactDef();
      break;
    case 'radio':
      definition = getRadioImpactDef();
      break;
    case 'empty':
      definition = getEmptyImpactDef();
  }

  if (definition?.type !== type) {
    // TODO error or warning,
  }

  return definition;
}

// TODO check all of that when the display is implemented

// TODO somewhere check that all impacts are valid

export function getEmptyImpactDef(): Definition<EmptyImpact> {
  return {
    type: 'empty',
    getDefault: () => ({
      type: 'empty',
      uid: generateId(10),
      index: 0,
    }),
    validator: (_impact: EmptyImpact) => ({ success: true, messages: [] }),
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
    },
  };
}

export function getActivationImpactDef(): Definition<ActivationImpact> {
  return {
    type: 'activation',
    getDefault: () => ({
      type: 'activation',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      activableType: '',
      target: '',
      option: 'activate',
    }),
    validator: (impact: ActivationImpact) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (impact.delaySeconds < 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Delay cannot be negative',
          isTranslateKey: false,
        });
      }

      if (impact.target.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select something',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      option: ALL_EDITABLE,
      target: ALL_EDITABLE,
    },
  };
}

export function getChoiceEffectSelectionImpactDef(): Definition<ChoiceEffectSelectionImpact> {
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
    validator: (impact: ChoiceEffectSelectionImpact) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (impact.delaySeconds < 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Delay cannot be negative',
          isTranslateKey: false,
        });
      }

      if (impact.target.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select a target',
          isTranslateKey: false,
        });
      }

      if (impact.targetEffect.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select an effect',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      target: ALL_EDITABLE,
      targetEffect: ALL_EDITABLE,
    },
  };
}

export function getNotificationImpactDef(): Definition<NotificationMessageImpact> {
  return {
    type: 'notification',
    getDefault: () => ({
      type: 'notification',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      message: createOrUpdateTranslation('', undefined),
      roles: {
        // TODO make it dynamic
        ACS: false,
        MCS: false,
        AL: false,
        CASU: false,
        EVASAN: false,
        LEADPMA: false,
      },
    }),
    validator: (impact: NotificationMessageImpact) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (impact.delaySeconds < 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Delay cannot be negative',
          isTranslateKey: false,
        });
      }

      if (checkIsMessageEmpty(impact.message)) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Write a message',
          isTranslateKey: false,
        });
      }

      const hasSomeRoleSelected = Object.values(impact.roles).some(selection => selection);
      if (!hasSomeRoleSelected) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Set a recipient',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      roles: {} as any, // TODO ALL_EDITABLE,
    },
  };
}

export function getRadioImpactDef(): Definition<RadioMessageImpact> {
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
    validator: (impact: RadioMessageImpact) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (impact.delaySeconds < 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Delay cannot be negative',
          isTranslateKey: false,
        });
      }

      if (checkIsMessageEmpty(impact.message)) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Write a message',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      channel: ALL_EDITABLE,
    },
  };
}

function checkIsMessageEmpty(message: ITranslatableContent | undefined): boolean {
  return (
    message == undefined ||
    Object.values(message.translations).every(
      (transl: ITranslation) => transl?.translation?.trim().length === 0
    )
  );
}

export function getMapActivationImpactDef(): Definition<MapActivationImpact> {
  return {
    type: 'mapActivation',
    getDefault: () => ({
      type: 'mapActivation',
      uid: generateId(10),
      index: 0,
      delaySeconds: 0,
      activableType: '',
      target: '',
      option: 'activate',
      buildStatus: 'pending',
    }),
    validator: (impact: MapActivationImpact) => {
      let success: boolean = true;
      const messages: ValidationResult['messages'] = [];

      if (impact.delaySeconds < 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Delay cannot be negative',
          isTranslateKey: false,
        });
      }

      if (impact.target.trim().length === 0) {
        success = false;
        messages.push({
          logLevel: 'ERROR',
          message: 'Select something',
          isTranslateKey: false,
        });
      }

      return { success, messages };
    },
    view: {
      type: ALL_EDITABLE,
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      option: ALL_EDITABLE,
      target: ALL_EDITABLE,
      buildStatus: ALL_EDITABLE,
    },
  };
}
