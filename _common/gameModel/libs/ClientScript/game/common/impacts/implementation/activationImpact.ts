import { ITemplateDescriptor } from '../../actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../../actions/choiceDescriptor/choiceDescriptor';
import { ActorId } from '../../baseTypes';
import { Uid } from '../../interfaces';
import {
  ChangeActivableStatusLocalEvent,
  ChangeMapActivableStatusLocalEvent,
  LocalEventBase,
} from '../../localEvents/localEventBase';
import { BuildStatus, MapEntityDescriptor } from '../../mapEntities/mapEntityDescriptor';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { Trigger } from '../../triggers/trigger';
import { ImpactBase } from '../impact';

export type ActivationOperator = 'activate' | 'deactivate';

export interface ActivationImpact extends ImpactBase {
  type: 'activation';
  activableType:
    | ITemplateDescriptor['activableType']
    | ChoiceDescriptor['activableType']
    | Trigger['activableType']
    | MapEntityDescriptor['activableType']
    | undefined;
  target: Uid;
  option: ActivationOperator;
}

export function convertActivationImpact(
  state: Readonly<MainSimulationState>,
  impact: ActivationImpact,
  sourceId: Uid | ActorId
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new ChangeActivableStatusLocalEvent({
      parentEventId: state.getLastEventId(),
      sourceId: String(sourceId),
      simTimeStamp: time,
      target: impact.target,
      option: impact.option,
    }),
  ];
}

export interface MapActivationImpact extends ImpactBase {
  type: 'mapActivation';
  buildStatus: BuildStatus;
  target: Uid;
  option: ActivationOperator;
}

export function convertMapActivationImpact(
  state: Readonly<MainSimulationState>,
  impact: MapActivationImpact,
  sourceId: Uid | ActorId
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new ChangeMapActivableStatusLocalEvent(
      {
        parentEventId: state.getLastEventId(),
        sourceId: String(sourceId),
        simTimeStamp: time,
        target: impact.target,
        option: impact.option,
      },
      impact.buildStatus
    ),
  ];
}
