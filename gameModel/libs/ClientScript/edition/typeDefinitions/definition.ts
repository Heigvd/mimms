import { Typed } from '../../game/common/interfaces';

type Unarray<T> = T extends Array<infer U> ? U : T;

type EditionLevel = 'hidden' | 'visible' | 'editable';

/**
 * Might be directly mapped to WEGAS ADVANCED and INTERNAL views
 */
interface ConfigurationView {
  basic: EditionLevel;
  advanced: EditionLevel;
  expert: EditionLevel;
}

export const ALL_EDITABLE: ConfigurationView = {
  basic: 'editable',
  advanced: 'editable',
  expert: 'editable',
};

/**
 * Recursive type mapping
 * Each property of the object becomes a configuration view
 */
type ToConfigurationViewType<O extends object> = {
  [K in keyof O]: Unarray<O[K]> extends object
    ? ToConfigurationViewType<Unarray<O[K]>>
    : ConfigurationView;
};

export type MapToDefinition<U> = U extends Typed ? Definition<U> : never;
export type MapToTypeNames<U> = U extends Typed ? U['type'] : never;
export type MapToRecordByType<U> = U extends Typed ? Record<U['type'], Definition<U>> : never;

interface ValidationResult {
  success: boolean;
  messages: {
    logLevel: 'OFF' | 'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG';
    message: string;
    isTranslateKey: boolean;
  }[];
}

export interface Definition<T extends Typed> {
  type: T['type'];
  view: ToConfigurationViewType<T>;
  getDefault: () => T;
  validator: (value: T) => ValidationResult;
}
