import { Uid } from '../../interfaces';
import { ChangeActivableStatusLocalEvent, LocalEventBase } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export type ActivationOperator = 'activate' | 'deactivate';

export interface ActivationImpact extends ImpactBase {
  type: 'activation';
  activableType: string; // TODO see if useful
  target: Uid;
  option: ActivationOperator;
}

export function convertActivationImpact(
  state: Readonly<MainSimulationState>,
  impact: ActivationImpact,
  parentTriggerId: Uid
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new ChangeActivableStatusLocalEvent({
      parentEventId: state.getLastEventId(),
      parentTriggerId,
      simTimeStamp: time,
      target: impact.target,
      option: impact.option,
    }),
  ];
}
