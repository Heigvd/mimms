import { Uid } from '../../interfaces';
import {
  LocalEventBase,
  SourceType,
} from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';
import { SelectChoiceEffectLocalEvent } from '../../localEvents/localEventBaseActivable';

export interface ChoiceEffectSelectionImpact extends ImpactBase {
  type: 'effectSelection';
  target: Uid;
  targetEffect: Uid;
}

export function convertChoiceEffectSelectionImpact(
  state: Readonly<MainSimulationState>,
  impact: ChoiceEffectSelectionImpact,
  source: SourceType
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new SelectChoiceEffectLocalEvent({
      parentEventId: state.getLastEventId(),
      source,
      simTimeStamp: time,
      target: impact.target,
      effect: impact.targetEffect,
    }),
  ];
}
