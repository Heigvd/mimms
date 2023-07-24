import { getTranslation } from "../../../tools/translation";
import { InterventionRole } from "./interventionRole";

// TODO probably immutable
export class Actor{

  public readonly FullName;
  public readonly ShortName;
  public readonly Role;

  constructor(role: InterventionRole, fullName: string, shortName: string){
    this.Role = role;
    this.FullName = getTranslation('general-interface', fullName); // TODO
    this.ShortName = getTranslation('general-interface', shortName);
  }

}