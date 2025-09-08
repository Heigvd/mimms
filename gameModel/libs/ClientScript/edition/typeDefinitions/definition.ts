import { Indexed, Parented, SuperTyped, Typed } from '../../game/common/interfaces';

/**
 * Unboxes the type contained in an array
 */
type Unarray<T> = T extends Array<infer U> ? U : T;

/**
 * Removes all array fields in type
 */
type RemoveArrayFields<T> = {
  [K in keyof T as T[K] extends any[] ? never : K]: T[K];
};

type EditionLevel = 'hidden' | 'visible' | 'editable';

export type ViewConfig = 'basic' | 'advanced' | 'expert';

/**
 * Might be directly mapped to WEGAS ADVANCED and INTERNAL views
 */
type ConfigurationView = Record<ViewConfig, EditionLevel>;

export const ALL_EDITABLE: Record<ViewConfig, EditionLevel> = {
  basic: 'editable',
  advanced: 'editable',
  expert: 'editable',
};

export const EXPERT_ONLY: Record<ViewConfig, EditionLevel> = {
  basic: 'hidden',
  advanced: 'hidden',
  expert: 'editable',
};

/**
 * Recursive type mapping
 * Primitives and types that extend Type become configuration views
 * otherwise => recurse
 */
type ToConfigurationViewType<O extends object> = {
  [K in keyof O]: Unarray<O[K]> extends object
    ? Unarray<O[K]> extends Typed
      ? ConfigurationView
      : ToConfigurationViewType<Unarray<O[K]>>
    : ConfigurationView;
};

export type MapToDefinition<U> = U extends Typed ? Definition<U> : never;
export type MapToTypeNames<U> = U extends Typed ? U['type'] : never;

export type MapToSuperTypeNames<U> = U extends SuperTyped ? U['superType'] : never;

/**
 * Omit all arrays (children) and adds required interfaces
 * (Note to devs: if removing all array fields is problematic,
 * then selecting specifically the removed fields could be an option)
 */
export type MapToFlatType<T extends Typed & Indexed, S extends keyof any> = RemoveArrayFields<T> &
  Parented &
  SuperTyped & { superType: S };

//export type MapToRecordByType<U> = [U] extends [Typed] ? Record<U['type'], Definition<U>> : never;

export interface ValidationResult {
  success: boolean;
  messages: {
    logLevel: 'OFF' | 'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG';
    message: string;
    isTranslateKey: boolean; // TODO why translate key ? Scenarist is not all in english ?
  }[];
}

export interface Definition<T extends Typed> {
  type: T['type'];
  view: ToConfigurationViewType<T>;
  getDefault: () => T;
  validator: (value: T) => ValidationResult;
}
