import { ActorId } from '../../baseTypes';
import { Uid } from '../../interfaces';
import { LocalEventBase, SelectChoiceEffectLocalEvent } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface ChoiceEffectSelectionImpact extends ImpactBase {
  type: 'effectSelection';
  target: Uid;
  targetEffect: Uid;
}

export function convertChoiceEffectSelectionImpact(
  state: Readonly<MainSimulationState>,
  impact: ChoiceEffectSelectionImpact,
  parentTriggerId: Uid | ActorId
): LocalEventBase[] {
  const time = state.getSimTime() + impact.delaySeconds;
  return [
    new SelectChoiceEffectLocalEvent({
      parentEventId: state.getLastEventId(),
      parentTriggerId,
      simTimeStamp: time,
      target: impact.target,
      effect: impact.targetEffect,
    }),
  ];
}
