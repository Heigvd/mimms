import { fetchActionTemplate } from '../../mainSimulationLogic';
import { ActionBase } from '../actions/actionBase';
import { ActionTemplateBase } from '../actions/actionTemplateBase';
import { Actor } from '../actors/actor';
import { ActorId, TemplateRef } from '../baseTypes';
import { MainSimulationState } from './mainSimulationState';

export function getAvailableActionTemplate(
  state: Readonly<MainSimulationState>,
  actorId: ActorId,
  ref: TemplateRef
): ActionTemplateBase | undefined {
  const actionTemplate: ActionTemplateBase | undefined = fetchActionTemplate(ref);
  const actor: Readonly<Actor | undefined> = state.getActorById(actorId);

  if (
    actionTemplate !== undefined &&
    actor !== undefined &&
    actionTemplate.isAvailable(state, actor)
  ) {
    return actionTemplate;
  }

  return undefined;
}

export function getOngoingActionsForActor(
  state: Readonly<MainSimulationState>,
  actorUid: number
): ActionBase[] {
  return getOngoingActions(state).filter((a: ActionBase) => a.ownerId === actorUid);
}

export function getOngoingActions(state: Readonly<MainSimulationState>): ActionBase[] {
  return state.getAllActions().filter((a: ActionBase) => a.getStatus() === 'OnGoing');
}
