import { Uid } from '../../interfaces';
import {
  ChangeActivableStatusLocalEvent,
  ChangeMapActivableStatusLocalEvent,
  LocalEventBase,
} from '../../localEvents/localEventBase';
import { BuildStatus } from '../../mapEntities/mapEntityDescriptor';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export type ActivationOperator = 'activate' | 'deactivate';

export interface ActivationImpact extends ImpactBase {
  type: 'activation' | 'mapActivation';
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

export interface MapActivationImpact extends ActivationImpact {
  type: 'mapActivation';
  buildStatus: BuildStatus;
}

export function convertMapActivationImpact(
  state: Readonly<MainSimulationState>,
  impact: MapActivationImpact,
  parentTriggerId: Uid
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new ChangeMapActivableStatusLocalEvent(
      {
        parentEventId: state.getLastEventId(),
        parentTriggerId,
        simTimeStamp: time,
        target: impact.target,
        option: impact.option,
      },
      impact.buildStatus
    ),
  ];
}
