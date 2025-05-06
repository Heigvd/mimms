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
 * Runtime activable interface
 * active means that the object referenced by its uid can be active or inactive
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
  tag: Tag;
}
