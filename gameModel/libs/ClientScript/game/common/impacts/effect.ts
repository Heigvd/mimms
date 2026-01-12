import { IDescriptor, Indexed, Tag, Typed, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { convertToLocalEvents, Impact } from './impact';

export interface Effect extends IDescriptor, Indexed, Typed {
  type: 'effect';
  /**
   * Friendly name for scenarist
   */
  tag: Tag;
  /**
   * Owning choice id
   */
  parent: Uid;
  impacts: Impact[];
}

export function evaluateEffectImpacts(
  state: Readonly<MainSimulationState>,
  effect: Effect
): LocalEventBase[] {
  return effect.impacts.flatMap(impact => convertToLocalEvents(state, impact, effect.uid));
}
