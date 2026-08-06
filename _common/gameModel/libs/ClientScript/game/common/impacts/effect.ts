import { SimTime } from '../baseTypes';
import { IDescriptor, Indexed, Tag, Typed, Uid } from '../interfaces';
import { LocalEventBase } from '../localEvents/localEventBase';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { convertToLocalEvents, Impact, DelayImpactFrom } from './impact';
import { ActionBase } from '../actions/actionBase';

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

/**
 * Evaluates only the impacts of the effect whose delayFrom matches the given phase,
 * anchoring their delaySeconds on anchorTime (the action's start or end time).
 */
export function evaluateEffectImpacts(
  state: Readonly<MainSimulationState>,
  effect: Effect,
  actionId: ActionBase['Uid'],
  delayFrom: DelayImpactFrom,
  anchorTime: SimTime
): LocalEventBase[] {
  return effect.impacts
    .filter(impact => impact.type !== 'empty' && impact.delayFrom === delayFrom)
    .flatMap(impact => convertToLocalEvents(state, impact, { type: 'action', id: actionId }, anchorTime));
}
