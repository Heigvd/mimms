import { getTranslation } from '../../../tools/translation';
import { ActionType, RadioType } from '../actionType';
import { TranslationKey } from '../baseTypes';

const translationCategory: keyof VariableClasses = 'mainSim-radio';

export function getRadioTranslation(
  translationKey: TranslationKey,
  upperCaseFirstLetter?: boolean
): string {
  return getTranslation(translationCategory, translationKey, upperCaseFirstLetter);
}

export interface RadioChannel {
  type: RadioType;
  translationKey: TranslationKey;
}

export function getRadioChannels(): Record<RadioType, RadioChannel> {
  return {
    CASU_RADIO: {
      type: ActionType.CASU_RADIO,
      translationKey: 'radio-channel-casu',
    },
    ACTORS_RADIO: {
      type: ActionType.ACTORS_RADIO,
      translationKey: 'radio-channel-actors',
    },
    RESOURCES_RADIO: {
      type: ActionType.RESOURCES_RADIO,
      translationKey: 'radio-channel-rh',
    },
    EVASAN_RADIO: {
      type: ActionType.EVASAN_RADIO,
      translationKey: 'radio-channel-evacuation',
    },
  };
}

export function getResourceAsSenderName(): string {
  return getRadioTranslation('radio-sender-resources', false);
}

export function getResourceAsRecipientName(): string {
  return getRadioTranslation('radio-recipient-resources', false);
}
