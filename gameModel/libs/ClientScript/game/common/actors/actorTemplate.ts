import { Actor } from './actor';

// TODO might be unnecessary...
export class ActorTemplate {
  public instanciate(): Actor {
    return new Actor('AL', '', '');
  }
}
