import { getTranslation } from "../../../tools/translation";
import { ActorId, TranslationKey } from "../baseTypes";

export type InterventionRole = 'ACS' | 'MCS' | 'AL' | 'EVASAN'

export class Actor{

  private static IdSeed = 1000;

  public readonly FullName;
  public readonly ShortName;
  public readonly Role;

  public readonly Uid: ActorId;

  constructor(role: InterventionRole, fullName: TranslationKey, shortName: TranslationKey){
    this.Role = role;
    this.FullName = getTranslation('general-interface', fullName); // TODO
    this.ShortName = getTranslation('general-interface', shortName);

    this.Uid = Actor.IdSeed++;
  }

}