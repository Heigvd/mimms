import { Effect } from '../../impacts/effect';
import { IActivableDescriptor, IDescriptor, Indexed, Typed, Uid } from '../../interfaces';

export interface ChoiceDescriptor extends IActivableDescriptor, IDescriptor, Typed, Indexed {
  type: 'choice';
  activableType: 'choice';
  parent: Uid; // owning action template descriptor
  title: ITranslatableContent;
  description: ITranslatableContent;
  /**
   * Displayed mapEntityDescriptor
   */
  displayedMapEntity?: Uid;
  /**
   * The number of times this choice can be played. < 1 means infinitely
   */
  repeats: number;
  /**
   * The delta of seconds regarding the duration defined in the action template descriptor
   */
  durationDeltaSec: number;
  /**
   * Selected effect at start
   */
  defaultEffect: Uid;
  /**
   * list of possible effects
   */
  effects: Effect[];
}

// TODO Implement a MapChoiceDescriptor which has displayedMapEntity instead
// TODO to avoid non-null assertions elsewhere
