import { Effect } from '../../impacts/effect';
import { IActivableDescriptor, IDescriptor, Typed, Uid } from '../../interfaces';

export interface ChoiceDescriptor extends IActivableDescriptor, IDescriptor, Typed {
  type: 'choice';
  activableType: 'choice';
  parent: Uid; // owning template descriptor
  description: string; // TODO multilang
  label: string; // TODO multilang

  placeHolder: Uid; //reference to geometry
  /**
   * Selected effect at start
   */
  defaultEffect: Uid;
  /**
   * list of possible effects
   */
  effects: Effect[];
}
