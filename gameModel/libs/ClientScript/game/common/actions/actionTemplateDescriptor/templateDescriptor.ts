import { IActivableDescriptor, IDescriptor, Typed } from '../../interfaces';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { FullyConfigurableTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/fullyConfigurableTemplate';
import { MoveActorTemplateDescriptor } from '../actionTemplateDescriptor/descriptors/moveTemplate';
import { ChoiceDescriptor } from '../choiceDescriptor/choiceDescriptor';

export interface ITemplateDescriptor extends IActivableDescriptor, IDescriptor, Typed {
  activableType: 'actionTemplate';
  /**
   *  the number of times this template can generate an action
   *  */
  repeatable: number;
  /**
   * indicates that the template mandatory for the game configuration to be sound
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
   * In case of map entity placement binding that should be used
   */
  binding: LOCATION_ENUM | undefined;
}

export type TemplateDescriptor = MoveActorTemplateDescriptor | FullyConfigurableTemplateDescriptor;
