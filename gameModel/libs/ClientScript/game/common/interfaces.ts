/**
 * Any class that should be cloneable should implement this interface
 * (deep clone does not preserve functions on classes)
 * all mutable (non readonly) class field should be cloned
 */
export interface IClonable {
  clone(): this;
}

/**
 * Unique id base64
 */
export type Uid = string;
/**
 * Used by scenarist to identify elements, friendly name, soft reference
 */
export type Tag = string;

export interface IDescriptor {
  uid: Uid;
}

/**
 * For easier type discrimination in ts. (runtime typing)
 */
export interface Typed {
  type: string;
}

/**
 * For more general types (e.g. Impact)
 */
export interface SuperTyped {
  superType: string;
}

/**
 *
 */
export interface Parented {
  parent: Uid;
}

/**
 * To sort (for display as well as processing)
 */
export interface Indexed {
  index: number;
}

/**
 * Runtime activable interface
 * activable means that the object referenced by its uid can be active or inactive
 */
export interface IActivable {
  type: string;
  ref: Uid;
}

/**
 * Scenarist configuration activable interface
 */
export interface IActivableDescriptor {
  activableType: string;
  activeAtStart: boolean;
  /**
   * Friendly name used by scenarist
   */
  tag: Tag;
}

export function isActivableDescriptor(obj: any): obj is IActivableDescriptor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.activableType === 'string' &&
    typeof obj.activeAtStart === 'boolean' &&
    typeof obj.tag === 'string'
  );
}
