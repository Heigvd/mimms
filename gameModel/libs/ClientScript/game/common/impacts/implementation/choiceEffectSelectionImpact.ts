import { Uid } from '../../interfaces';
import { LocalEventBase } from '../../localEvents/localEventBase';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ImpactBase } from '../impact';

export interface ChoiceEffectSelectionImpact extends ImpactBase {
  type: 'choice';
  targetEffect: Uid;
}

export function convertChoiceEffectSelectionImpact(
  state: MainSimulationState,
  impact: ChoiceEffectSelectionImpact,
  parentTriggerId: Uid
): LocalEventBase[] {
  // TODO get the activable and change the selected choice
  return [];
}
