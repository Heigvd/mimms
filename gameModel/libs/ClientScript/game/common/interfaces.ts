/**
 * Any class that should be cloneable should implement this interface
 * (deep clone does not preserve functions on classes)
 * all mutable (non readonly) class field should be cloned
 */
export interface IClonable {
  clone(): this;
}
