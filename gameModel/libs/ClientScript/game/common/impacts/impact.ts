import { IDescriptor, Indexed, Typed, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActivationImpact, convertActivationImpact } from './implementation/activationImpact';
import {
  ChoiceEffectSelectionImpact,
  convertChoiceEffectSelectionImpact,
} from './implementation/choiceEffectSelectionImpact';
import {
  convertNotificationImpact,
  NotificationMessageImpact,
} from './implementation/notificationImpact';
import { convertRadioMessageImpact, RadioMessageImpact } from './implementation/radioImpact';

/**
 * Impacts are meant to produce local events that will in turn modify the state of the game
 */
export interface ImpactBase extends IDescriptor, Typed, Indexed {
  delaySeconds: number; // time to wait before processing the produced local events
}

export type Impact =
  | ActivationImpact
  | ChoiceEffectSelectionImpact
  | NotificationMessageImpact
  | RadioMessageImpact;

export function convertToLocalEvents(
  state: Readonly<MainSimulationState>,
  impact: Impact,
  parentTriggerId: Uid
): LocalEventBase[] {
  switch (impact.type) {
    case 'activation':
      return convertActivationImpact(state, impact, parentTriggerId);
    case 'effectSelection':
      return convertChoiceEffectSelectionImpact(state, impact, parentTriggerId);
    case 'notification':
      return convertNotificationImpact(state, impact, parentTriggerId);
    case 'radio':
      return convertRadioMessageImpact(state, impact, parentTriggerId);
    default:
      return [];
  }
}
