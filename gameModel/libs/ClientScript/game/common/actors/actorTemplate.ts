import { LOCATION_ENUM } from '../simulationState/locationState';
import { Actor, InterventionRole } from './actor';

// Currently not used, considered for use in MIM-93
export class ActorTemplate {
  public readonly Role: InterventionRole;
  private symbolicLocation: LOCATION_ENUM;

  constructor(role: InterventionRole, symbolicLocation: LOCATION_ENUM) {
    this.Role = role;
    this.symbolicLocation = symbolicLocation;
  }

  public instanciate(): Actor {
    return new Actor(this.Role, this.symbolicLocation);
  }
}
