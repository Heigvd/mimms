import { Effect } from '../../impacts/effect';
import { IActivableDescriptor, IDescriptor, Indexed, Typed, Uid } from '../../interfaces';

export interface ChoiceDescriptor extends IActivableDescriptor, IDescriptor, Typed, Indexed {
  type: 'choice';
  activableType: 'choice';
  parent: Uid; // owning action template descriptor
  description: string; // TODO multilang
  title: string; // TODO multilang

  placeHolder: Uid; //reference to map object
  /**
   * Selected effect at start
   */
  defaultEffect: Uid;
  /**
   * list of possible effects
   */
  effects: Effect[];
}
