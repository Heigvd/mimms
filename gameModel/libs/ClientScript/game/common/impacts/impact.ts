import { ActorId } from '../baseTypes';
import { IDescriptor, Indexed, Typed, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  ActivationImpact,
  convertActivationImpact,
  convertMapActivationImpact,
  MapActivationImpact,
} from './implementation/activationImpact';
import {
  ChoiceEffectSelectionImpact,
  convertChoiceEffectSelectionImpact,
} from './implementation/choiceEffectSelectionImpact';
import { EmptyImpact } from './implementation/emptyImpact';
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
  | MapActivationImpact
  | ChoiceEffectSelectionImpact
  | NotificationMessageImpact
  | RadioMessageImpact
  | EmptyImpact;

/***
 * @param state the game current state
 * @param impact the impact descriptor
 * @param sourceId id of the trigger or actor that triggered this impact
 */
export function convertToLocalEvents(
  state: Readonly<MainSimulationState>,
  impact: Impact,
  sourceId: Uid | ActorId
): LocalEventBase[] {
  switch (impact.type) {
    case 'activation':
      return convertActivationImpact(state, impact, sourceId);
    case 'mapActivation':
      return convertMapActivationImpact(state, impact, sourceId);
    case 'effectSelection':
      return convertChoiceEffectSelectionImpact(state, impact, sourceId);
    case 'notification':
      return convertNotificationImpact(state, impact, sourceId);
    case 'radio':
      return convertRadioMessageImpact(state, impact, sourceId);
    default:
      return [];
  }
}
