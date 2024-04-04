import { getTranslation } from "../../../tools/translation";
import { ActorId, TranslationKey } from "../baseTypes";
import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";

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
}

/**
 * Defines ascendance in leadership
 */
type AuthorityLevel = number;

/**
 * 0 = top level
 */
export const hierarchyLevels : Record<InterventionRole, AuthorityLevel> = {
	ACS: 0,
	MCS: 0,
	LEADPMA: 10,
	EVASAN:20,
	AL : 30,
	CASU : 40
} as const;

/**
 * Sort actors by leadership level
 * The first element has the highest leadership level
 */
export function sortByHierarchyLevel(actors : Readonly<Actor[]>){
  return [...actors].sort((a, b) => hierarchyLevels[a.Role] - hierarchyLevels[b.Role]).filter(actor => actor.Role != 'CASU');
}

export class Actor{

  private static IdSeed = 1000;

  public readonly FullName;
  public readonly ShortName;
  public readonly Role;

  //current actor location
  public Location: LOCATION_ENUM;

  //responsible for this location
  private symbolicLocation: LOCATION_ENUM;

  public readonly Uid: ActorId;

  private readonly translationVar : keyof VariableClasses = 'mainSim-actors';

  constructor(role: InterventionRole, symbolicLocation: LOCATION_ENUM = symbolicLocationMatrix[role]){
    this.Role = role;
	const tkey : TranslationKey= `actor-${role.toLowerCase()}`;
    this.ShortName = getTranslation(this.translationVar, tkey);
    this.FullName = getTranslation(this.translationVar, tkey + '-long');
	this.symbolicLocation = symbolicLocation;
	//current actor location is the sysmbolic location at the beginning
	this.Location = symbolicLocation;
    this.Uid = Actor.IdSeed++;
  }

  static resetIdSeed() {
    this.IdSeed = 1000;
  }

  /**
   * Update the location of the Actor
   * @param LOCATION_ENUM New location
   */
  public setLocation(location: LOCATION_ENUM) {
	  this.Location = location;
  }

/**
 * Compute the available symbolic location of the actor
 * @param MainSimulationState
 */
  public getComputedSymbolicLocation(state: Readonly<MainSimulationState>): LOCATION_ENUM {
	  const so = state.getInternalStateObject();

	  if (so.mapLocations.find(l => l.id === this.symbolicLocation)) {
		  return this.symbolicLocation;
	  } else if (so.mapLocations.find(l => l.id === LOCATION_ENUM.PC)) {
		  return LOCATION_ENUM.PC;
	  }

	  return LOCATION_ENUM.meetingPoint;
  }
}