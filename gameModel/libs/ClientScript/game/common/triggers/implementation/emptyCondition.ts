import { IDescriptor, Indexed, Typed } from '../../interfaces';

/**
 * Condition that does nothing, meaning it should neither return true neither false
 * Has to be filtered out
 */
export interface EmptyCondition extends IDescriptor, Typed, Indexed {
  type: 'empty';
}
