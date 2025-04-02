import { triggerLogger } from '../../../tools/logger';
import { InterventionRole } from '../actors/actor';
import {
  AddMessageLocalEvent,
  AddRadioMessageLocalEvent,
  LocalEventBase,
} from '../localEvents/localEventBase';
import { RadioType } from '../radio/communicationType';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { IActivable } from './common';

// impacts
interface ImpactBase {
  type: string;
  delaySeconds: number;
}

interface NotificationMessageImpact extends ImpactBase {
  type: 'notification';
  message: any; //TODO multilang
  role: InterventionRole; // TODO
}

interface RadioMessageImpact extends ImpactBase {
  type: 'radio';
  message: any; //TODO
  canal: RadioType; // TODO
}

interface ActivationImpact extends ImpactBase {
  type: 'activation';
  target: IActivable;
  operator: 'activate' | 'deactivate';
}

export type Impact = NotificationMessageImpact | RadioMessageImpact | ActivationImpact;

export function convertToLocalEvents(
  state: MainSimulationState,
  impact: Impact,
  triggerId: number
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

function convertActivationImpact(
  state: MainSimulationState,
  impact: ActivationImpact,
  triggerId: number
): LocalEventBase[] {
  return [];
  // add / modify entry in activables through local event
}

function convertNotificationImpact(
  state: MainSimulationState,
  impact: NotificationMessageImpact,
  triggerId: number
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  const actors = state.getOnSiteActors().filter(a => a.Role === impact.role);
  triggerLogger.debug('sasdadsasd', actors);
  return actors.map(
    a =>
      new AddMessageLocalEvent(
        triggerId,
        time,
        1000, // TODO
        'Event Manageer', // TODO specific name
        a.Uid,
        impact.message
      )
  );
}

function convertRadioNotificationImpact(
  state: MainSimulationState,
  impact: RadioMessageImpact,
  triggerId: number
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new AddRadioMessageLocalEvent(
      triggerId,
      time,
      1000, // TODO senderID
      'Event Manager sender name?', // TODO sender name
      undefined, // recipient id
      impact.message,
      impact.canal
    ),
  ];
}
