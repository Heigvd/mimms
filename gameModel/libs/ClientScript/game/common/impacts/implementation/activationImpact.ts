import { Uid } from '../../interfaces';
import { LocalEventBase } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export type ActivationOperator = 'activate' | 'deactivate';

export interface ActivationImpact extends ImpactBase {
  type: 'activation';
  target: Uid;
  operator: ActivationOperator;
}

export function convertActivationImpact(
  state: MainSimulationState,
  impact: ActivationImpact,
  triggerId: Uid
): LocalEventBase[] {
  return [];
  // add / modify entry in activables through local event
}
