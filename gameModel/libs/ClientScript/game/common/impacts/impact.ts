import { Typed, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActivationImpact, convertActivationImpact } from './implementation/activationImpact';
import {
  convertNotificationImpact,
  NotificationMessageImpact,
} from './implementation/notificationImpact';
import { convertRadioNotificationImpact, RadioMessageImpact } from './implementation/radioImpact';

/**
 * Impacts are meant to produce local events that will in turn modify the state of the game
 */
export interface ImpactBase extends Typed {
  delaySeconds: number;
  priority: number;
}

export type Impact = NotificationMessageImpact | RadioMessageImpact | ActivationImpact;

export function convertToLocalEvents(
  state: MainSimulationState,
  impact: Impact,
  parentId: Uid
): LocalEventBase[] {
  switch (impact.type) {
    case 'activation':
      return convertActivationImpact(state, impact, parentId);
    case 'notification':
      return convertNotificationImpact(state, impact, parentId);
    case 'radio':
      return convertRadioNotificationImpact(state, impact, parentId);
    default:
      return [];
  }
}
