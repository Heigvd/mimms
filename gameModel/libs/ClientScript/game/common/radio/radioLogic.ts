import { getTranslation } from '../../../tools/translation';
import { TranslationKey } from '../baseTypes';
import { RadioType } from './communicationType';
import { HospitalProximity } from '../evacuation/hospitalType';

const translationCategory: keyof VariableClasses = 'mainSim-radio';

export function getRadioTranslation(
  translationKey: TranslationKey,
  upperCaseFirstLetter?: boolean
): string {
  return getTranslation(translationCategory, translationKey, upperCaseFirstLetter);
}

export function getProximityTranslation(proximity: HospitalProximity | string): string {
  return getRadioTranslation('radio-proximity-' + proximity);
}

export interface RadioChannel {
  type: RadioType;
  translationKey: TranslationKey;
}

export function getRadioChannels(): Record<RadioType, RadioChannel> {
  return {
    CASU: {
      type: RadioType.CASU,
      translationKey: 'radio-channel-casu',
    },
    ACTORS: {
      type: RadioType.ACTORS,
      translationKey: 'radio-channel-actors',
    },
    RESOURCES: {
      type: RadioType.RESOURCES,
      translationKey: 'radio-channel-rh',
    },
    EVASAN: {
      type: RadioType.EVASAN,
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
