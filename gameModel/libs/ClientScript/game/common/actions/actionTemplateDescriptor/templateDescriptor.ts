import { InterventionRole } from '../../actors/actor';
import { IActivableDescriptor, IDescriptor, Indexed, Typed } from '../../interfaces';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { FullyConfigurableTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { MoveActorTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/moveTemplate';
import { ChoiceDescriptor } from '../choiceDescriptor/choiceDescriptor';
import { MapChoiceActionTemplateDescriptor } from './descriptors/mapChoiceTemplate';

export interface ITemplateDescriptor extends IActivableDescriptor, IDescriptor, Typed, Indexed {
  activableType: 'actionTemplate';
  /**
   * Defines which action template constructor should be called to build a runtime instance
   */
  constructorType: string; // TODO constraint typing ?
  /**
   *  the number of times this template can generate an action
   */
  // TODO specifications for unlimited repetitions
  repeats: number;
  /**
   * indicates that the template mandatory for the game configuration to be sound
   * and that this template cannot be deactivated by the scenarist (in basic mode)
   */
  mandatory: boolean;
  /**
   * Title displayed to the player in the action panel
   */
  title: ITranslatableContent;
  /**
   * Displayed to the player in the action panel
   */
  description: ITranslatableContent;
  /**
   * Available choices to the player
   */
  choices: ChoiceDescriptor[];
  /**
   * Which roles are allowed to generate an action
   */
  availableToRoles: Record<InterventionRole, boolean>;
  /**
   * In case of map entity placement, logical binding that should be used
   */
  binding: LOCATION_ENUM | undefined;
  /**
   * In case of map entity placement, show all choices on the map
   */
  showAllChoices: boolean;
  /**
   * The duration expressed in seconds
   */
  durationSec: number;
  /**
   * Comment, only visible by the scenarist
   */
  comment: string;
}

// TODO see if binding should be in a subtype ?
// TODO see if raised flags should be in the descriptor

export type TemplateDescriptor =
  | MoveActorTemplateDescriptor
  | FullyConfigurableTemplateDescriptor
  | MapChoiceActionTemplateDescriptor;
