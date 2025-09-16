import { IDescriptor, Indexed, Typed } from "../../interfaces"

/**
 * Empty impact that does nothing, used for scenarist interface purposes
 */
export interface EmptyImpact extends IDescriptor, Typed, Indexed {
  type : 'empty'
}