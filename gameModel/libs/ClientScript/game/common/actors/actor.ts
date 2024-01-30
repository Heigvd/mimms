import { getTranslation } from '../../../tools/translation';
import { ActorId, TranslationKey } from '../baseTypes';

export type InterventionRole = 'ACS' | 'MCS' | 'AL' | 'EVASAN' | 'LEADPMA' | 'CASU';

/**
 * Defines ascendance in leadership
 */
type AuthorityLevel = number;

/**
 * 0 = top level
 */
const hierarchyLevels: Record<InterventionRole, AuthorityLevel> = {
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

export class Actor {
	private static IdSeed = 1000;

	public readonly FullName;
	public readonly ShortName;
	public readonly Role;

	public readonly Uid: ActorId;

	private readonly translationVar: keyof VariableClasses = 'mainSim-actors';

	constructor(role: InterventionRole) {
		this.Role = role;
		const tkey: TranslationKey = `actor-${role.toLowerCase()}`;
		this.ShortName = getTranslation(this.translationVar, tkey);
		this.FullName = getTranslation(this.translationVar, tkey + '-long');
		this.Uid = Actor.IdSeed++;
	}

	static resetIdSeed() {
		this.IdSeed = 1000;
	}
}
