import { SimTime } from '../baseTypes';
import { IDescriptor, Indexed, Typed } from '../interfaces';
import { LocalEventBase, SourceType } from '../localEvents/localEventBase';
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
export type DelayImpactFrom = 'start' | 'end';

export interface ImpactBase extends IDescriptor, Typed, Indexed {
  delaySeconds: number; // time to wait before processing the produced local events
  delayFrom: DelayImpactFrom; // whether delaySeconds is counted from the action's start or end
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
 * @param source the trigger or action that triggered this impact
 * @param anchorTime the time from which impact.delaySeconds is counted
 */
export function convertToLocalEvents(
  state: Readonly<MainSimulationState>,
  impact: Impact,
  source: SourceType,
  anchorTime: SimTime
): LocalEventBase[] {
  switch (impact.type) {
    case 'activation':
      return convertActivationImpact(state, impact, source, anchorTime);
    case 'mapActivation':
      return convertMapActivationImpact(state, impact, source, anchorTime);
    case 'effectSelection':
      return convertChoiceEffectSelectionImpact(state, impact, source, anchorTime);
    case 'notification':
      return convertNotificationImpact(state, impact, source, anchorTime);
    case 'radio':
      return convertRadioMessageImpact(state, impact, source, anchorTime);
    default:
      return [];
  }
}
