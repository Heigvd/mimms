import { IActivableDescriptor, IDescriptor, Typed } from '../../interfaces';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { FixedMapEntityTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/fixedMapEntityTemplate';
import { FullyConfigurableTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { MoveActorTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/moveTemplate';
import { ChoiceDescriptor } from '../choiceDescriptor/choiceDescriptor';

export interface ITemplateDescriptor extends IActivableDescriptor, IDescriptor, Typed {
  activableType: 'actionTemplate';
  /**
   * Defines which action template constructor should be called to build a runtime instance
   */
  constructorType: string; // TODO constraint typing ?
  /**
   *  the number of times this template can generate an action
   */
  repeatable: number;
  /**
   * indicates that the template mandatory for the game configuration to be sound
   * and that this template cannot be deactivated by the scenarist (in basic mode)
   */
  mandatory: boolean;
  /**
   * Title displayed to the player in the action panel
   */
  title: string; // TODO multilang
  /**
   * Displayed to the player in the action panel
   */
  description: string; // TODO multilang
  /**
   * Available choices to the player
   */
  choices: ChoiceDescriptor[];
  /**
   * In case of map entity placement, logical binding that should be used
   */
  binding: LOCATION_ENUM | undefined;
  /**
   * The duration expressed in seconds
   */
  durationSec: number;
}

// TODO see if binding should be in a subtype ?
// TODO see if raised flags should be in the descriptor

export type TemplateDescriptor =
  | MoveActorTemplateDescriptor
  | FullyConfigurableTemplateDescriptor
  | FixedMapEntityTemplateDescriptor;
