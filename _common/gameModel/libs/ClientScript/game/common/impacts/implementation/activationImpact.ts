import { ITemplateDescriptor } from '../../actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../../actions/choiceDescriptor/choiceDescriptor';
import { Uid } from '../../interfaces';
import {
  LocalEventBase,
  SourceType,
} from '../../localEvents/localEventBase';
import { BuildStatus, MapEntityDescriptor } from '../../mapEntities/mapEntityDescriptor';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { Trigger } from '../../triggers/trigger';
import { ImpactBase } from '../impact';
import {
  ChangeActivableStatusLocalEvent,
  ChangeMapActivableStatusLocalEvent,
} from '../../localEvents/localEventBaseActivable';

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
  source: SourceType
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new ChangeActivableStatusLocalEvent({
      parentEventId: state.getLastEventId(),
      source,
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
  source: SourceType
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new ChangeMapActivableStatusLocalEvent(
      {
        parentEventId: state.getLastEventId(),
        source,
        simTimeStamp: time,
        target: impact.target,
        option: impact.option,
      },
      impact.buildStatus
    ),
  ];
}
