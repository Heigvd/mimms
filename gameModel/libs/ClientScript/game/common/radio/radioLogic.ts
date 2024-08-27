import { ActionType, RadioType } from '../actionType';
import { TranslationKey } from '../baseTypes';

export interface RadioChannel {
  type: RadioType;
  translationKey: TranslationKey;
}

export function getRadioChannels(): Record<RadioType, RadioChannel> {
  return {
    CASU_RADIO: {
      type: ActionType.CASU_RADIO,
      translationKey: 'radio-channel-centrale',
    },
    ACTORS_RADIO: {
      type: ActionType.ACTORS_RADIO,
      translationKey: 'radio-channel-intra',
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
