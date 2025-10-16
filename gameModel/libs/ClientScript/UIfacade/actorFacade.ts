import { Actor } from '../game/common/actors/actor';
import { ActorId } from '../game/common/baseTypes';
import { CommMedia } from '../game/common/resources/resourceReachLogic';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';
import { getInterfaceConfiguration } from '../gameInterface/interfaceConfiguration';
import { openOverlayItem } from '../gameMap/mapEntities';
import { getPlayerRolesSelf } from '../multiplayer/multiplayerManager';
import * as TaskFacade from './taskFacade';
import { isOngoingAndStartedAction } from '../game/common/simulationState/actionStateAccess';
import { OnTheRoadAction } from '../game/common/actions/actionBase';
import { InterfaceState } from '../gameInterface/interfaceState';
import { canActorPlanAction } from '../gameInterface/main';
import { getTranslation } from '../tools/translation';
import { selectionLayerRef } from '../gameMap/main';

/**
 * @returns All currently present actors
 */
export function getAllActors(): Readonly<Actor[]> {
  return getCurrentState().getAllActors();
}

// used in page 43
export function selectActor(id: ActorId): InterfaceState {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.currentActorUid = id;
  newState.resources.allocateResources.currentTaskId =
    TaskFacade.initResourceManagementCurrentTaskId(id, getActor(id)?.Location, CommMedia.Direct);
  Context.interfaceState.setState(newState);
  return newState;
}

// used in page 43
export function selectActorAndOpenMapLocation(id: ActorId) {
  const newState = selectActor(id);
  openOverlayItem(getActorLocation(id)!);
  selectionLayerRef.current.changed();
  return newState;
}

/**
 * @returns All actors available to the current player
 */
export function getCurrentPlayerActors(): Readonly<Actor[]> {
  const playerRoles = getPlayerRolesSelf();
  return getCurrentState()
    .getAllActors()
    .filter(actor => playerRoles[actor.Role]);
}

/**
 * @returns All actors available to the current player that can plan a new action
 */
export function getPlayerIdleActors(): Readonly<Actor[]> {
  return getCurrentPlayerActors().filter(actor => canActorPlanAction(actor.Uid));
}

/**
 * @returns true if there are actors available to the current player that can plan a new action
 */
export function hasPlayerIdleActors(): boolean {
  return getPlayerIdleActors().length > 0;
}

/**
 * @returns a message if the player hasn't assigned an action to one/several actors
 */
export function getIdleActorsWarningMessage(): string {
  return (
    getPlayerIdleActors()
      .map(actor => actor.ShortName)
      .join(', ') + getTranslation('mainSim-interface', 'soft-warning')
  );
}

/**
 * @returns All actors visible to the current player (in the timeline)
 */
export function getVisibleActorsInTimelineForCurrentPlayer() {
  return getInterfaceConfiguration().timeline.viewNonPlayerActors
    ? getAllActors().filter(actor => actor.Role != 'CASU')
    : getCurrentPlayerActors();
}

/**
 * Given a list of actors, filters those which are played by the current player
 */
export function getCurrentPlayerActorIds(actors: Readonly<Actor[]>): ActorId[] {
  const roles = getPlayerRolesSelf();
  return actors.filter(a => roles[a.Role]).map(a => a.Uid);
}

/**
 * Returns the number of actors on site by the current player
 */
export function getCurrentPlayerOnsiteActorCount(): number {
  return getCurrentPlayerActors().filter(a => a.isOnSite()).length;
}

/**
 * Returns the number of actors playable by the current player
 */
export function getCurrentPlayerPlayableActorsCount(): number {
  const state = getCurrentState();
  return getCurrentPlayerActors().filter(
    actor => actor.isOnSite() || isOngoingAndStartedAction(state, actor.Uid, OnTheRoadAction)
  ).length;
}

export function canBePlayedByCurrentPlayer(actorId: ActorId): boolean {
  const currentPlayerActors = getCurrentPlayerActors();
  return currentPlayerActors.some(a => a.Uid === actorId);
}

/**
 * @returns Actor with given id or undefined
 */
// used in page 66
export function getActor(id: number): Readonly<Actor> | undefined {
  return getCurrentState().getActorById(id);
}

/**
 * Returns per actor interface color
 */
export function getInterfaceColorClass(id: ActorId): string {
  const actor = getActor(id);
  if (actor) {
    switch (actor.Role) {
      case 'ACS':
        return 'theme-acs';
      case 'MCS':
        return 'theme-mcs';
      case 'EVASAN':
        return 'theme-evasan';
      case 'LEADPMA':
        return 'theme-leadpma';
    }
  }
  return 'theme-al';
}

/**
 * Returns actors at given location
 * @param location
 */
export function getActorsByLocation(location: LOCATION_ENUM) {
  return getAllActors().filter(actor => actor.Location === location);
}

/**
 * Check if the current actor is at given location
 *
 * @param location Location to check
 */
// used in page 43
export function isCurrentActorAtLocation(location: LOCATION_ENUM): boolean {
  const currentActorUid = Context.interfaceState.state.currentActorUid;
  return getActorsByLocation(location).some(actor => actor.Uid === currentActorUid);
}

export function getSelectedActorLocation(): LOCATION_ENUM | undefined {
  const currentActorUid = Context.interfaceState.state.currentActorUid;
  return getActor(currentActorUid)?.Location;
}

export function getActorLocation(actorId: ActorId): LOCATION_ENUM | undefined {
  return getActor(actorId)?.Location;
}
