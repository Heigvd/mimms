import { Typed, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { ActivationImpact, convertActivationImpact } from './implementation/activationImpact';
import {
  convertNotificationImpact,
  NotificationMessageImpact,
} from './implementation/notificationImpact';
import { convertRadioNotificationImpact, RadioMessageImpact } from './implementation/radioImpact';

export interface ImpactBase extends Typed {
  delaySeconds: number;
}

export type Impact = NotificationMessageImpact | RadioMessageImpact | ActivationImpact;

export function convertToLocalEvents(
  state: MainSimulationState,
  impact: Impact,
  triggerId: Uid
): LocalEventBase[] {
  switch (impact.type) {
    case 'activation':
      return convertActivationImpact(state, impact, triggerId);
    case 'notification':
      return convertNotificationImpact(state, impact, triggerId);
    case 'radio':
      return convertRadioNotificationImpact(state, impact, triggerId);
    default:
      return [];
  }
}
