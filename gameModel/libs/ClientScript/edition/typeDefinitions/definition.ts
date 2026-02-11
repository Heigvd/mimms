import { Indexed, Parented, SuperTyped, Typed } from '../../game/common/interfaces';

/**
 * Unboxes the type contained in an array up to 3 levels of array
 */
type Unarray<T> = T extends Array<infer U> | Array<Array<infer U>> | Array<Array<Array<infer U>>>
  ? U
  : T;

/**
 * Removes all array fields in type
 */
type RemoveArrayFields<T> = {
  [K in keyof T as T[K] extends any[] ? never : K]: T[K];
};

export type EditionLevel = 'hidden' | 'visible' | 'editable';

export type ViewConfig = 'basic' | 'advanced' | 'expert';

/**
 * Might be directly mapped to WEGAS ADVANCED and INTERNAL views
 */
export type ConfigurationView = Record<ViewConfig, EditionLevel>;

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
export type ToConfigurationViewType<O extends object> = {
  [K in keyof O]: Unarray<O[K]> extends object
    ? Unarray<O[K]> extends Typed | ITranslatableContent
      ? ConfigurationView
      : ToConfigurationViewType<Unarray<O[K]>>
    : ConfigurationView;
};

export type MapToDefinition<U, VC> = U extends Typed ? Definition<U, VC> : never;

/**
 * Omit all arrays (children) and adds required interfaces
 * (Note to devs: if removing all array fields is problematic,
 * then selecting specifically the removed fields could be an option)
 */
export type MapToFlatType<T extends Typed & Indexed, SType extends string> = RemoveArrayFields<T> &
  Parented &
  SuperTyped & { superType: SType };

export interface ValidationMessage<VContext> {
  id: string;
  level: 'ERROR' | 'WARNING';
  title: string;
  description: string;
  validationContext: VContext;
}

export type ValidatorFunc<T extends Typed, VContext> = (
  value: T,
  validationCtx: VContext
) => ValidationMessage<VContext>[];

export interface Definition<T extends Typed, VContext> {
  type: T['type'];
  view: ToConfigurationViewType<T>;
  getDefault: () => T;
  validator: ValidatorFunc<T, VContext>;
}
