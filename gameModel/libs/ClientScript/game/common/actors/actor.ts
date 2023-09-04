import { getTranslation } from "../../../tools/translation";
import { ActorId, TranslationKey } from "../baseTypes";

export type InterventionRole = 'ACS' | 'MCS' | 'AL' | 'EVASAN'

export class Actor{

  private static IdSeed = 1000;

  public readonly FullName;
  public readonly ShortName;
  public readonly Role;

  public readonly Uid: ActorId;

  private readonly translationVar : keyof VariableClasses = 'mainSim-actors';

  constructor(role: InterventionRole, fullName: TranslationKey, shortName: TranslationKey){
    this.Role = role;
    this.FullName = getTranslation(this.translationVar, fullName);
    this.ShortName = getTranslation(this.translationVar, shortName);

    this.Uid = Actor.IdSeed++;
  }

}