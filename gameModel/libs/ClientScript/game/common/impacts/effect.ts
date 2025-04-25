import { IDescriptor, Tag, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { convertToLocalEvents, Impact } from './impact';

export interface Effect extends IDescriptor {
  tag: Tag;
  parent: Uid;
  impacts: Impact[];
}

export function evaluateEffectImpacts(
  state: MainSimulationState,
  effect: Effect
): LocalEventBase[] {
  return effect.impacts.flatMap(impact => convertToLocalEvents(state, impact, effect.uid));
}
