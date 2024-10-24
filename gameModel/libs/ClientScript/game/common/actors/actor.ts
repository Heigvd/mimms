import { ActorId } from '../baseTypes';
import { getMapLocationById, LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getRoleLongTranslation, getRoleShortTranslation } from './actorLogic';

export type InterventionRole = 'ACS' | 'MCS' | 'AL' | 'EVASAN' | 'LEADPMA' | 'CASU';

/**
 * Associates roles to their respective symbolic locations
 */
export const symbolicLocationMatrix: Record<InterventionRole, LOCATION_ENUM> = {
  ACS: LOCATION_ENUM.PC,
  MCS: LOCATION_ENUM.PC,
  AL: LOCATION_ENUM.chantier,
  EVASAN: LOCATION_ENUM.PC,
  LEADPMA: LOCATION_ENUM.PMA,
  CASU: LOCATION_ENUM.remote,
};

/**
 * Defines ascendance in leadership
 */
type AuthorityLevel = number;

/**
 * 0 = top level
 */
export const hierarchyLevels: Record<InterventionRole, AuthorityLevel> = {
  ACS: 0,
  MCS: 0,
  LEADPMA: 10,
  EVASAN: 20,
  AL: 30,
  CASU: 40,
} as const;

/**
 * Sort actors by leadership level
 * The first element has the highest leadership level
 */
export function sortByHierarchyLevel(actors: Readonly<Actor[]>) {
  return [...actors]
    .sort((a, b) => hierarchyLevels[a.Role] - hierarchyLevels[b.Role])
    .filter(actor => actor.Role != 'CASU');
}

const ACTOR_SEED_ID: ActorId = 1000;

export class Actor {
  private static idProvider: ActorId = ACTOR_SEED_ID;

  public static resetIdSeed() {
    Actor.idProvider = ACTOR_SEED_ID;
  }

  public readonly Uid: ActorId;

  public readonly FullName;
  public readonly ShortName;
  public readonly Role;

  //current actor location
  public Location: LOCATION_ENUM;

  //responsible for this location
  private readonly symbolicLocation: LOCATION_ENUM;

  constructor(
    role: InterventionRole,
    symbolicLocation: LOCATION_ENUM = symbolicLocationMatrix[role]
  ) {
    this.Uid = ++Actor.idProvider;
    this.Role = role;
    this.ShortName = getRoleShortTranslation(role);
    this.FullName = getRoleLongTranslation(role);
    this.symbolicLocation = symbolicLocation;
    // actor location is the symbolic location at the beginning
    this.Location = symbolicLocation;
  }

  /**
   * Update the location of the Actor
   * @param location New location
   */
  public setLocation(location: LOCATION_ENUM) {
    this.Location = location;
  }

  /**
   * Returns true if the actor has arrived at incident site
   */
  public isOnSite(): boolean {
    return this.Location && this.Location !== LOCATION_ENUM.remote;
  }

  /**
   * Compute the available symbolic location of the actor
   * @param state
   */
  public getComputedSymbolicLocation(state: Readonly<MainSimulationState>): LOCATION_ENUM {
    if (getMapLocationById(state, this.symbolicLocation)) {
      return this.symbolicLocation;
    } else if (getMapLocationById(state, LOCATION_ENUM.PC)) {
      return LOCATION_ENUM.PC;
    }

    return LOCATION_ENUM.pcFront;
  }
}
