import { Actor } from "../actors/actor";
import { GlobalEventId, SimTime } from "../baseTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { LocalEventBase } from "./localEventBase";

export class AddActorLocalEvent extends LocalEventBase {

  constructor(parentEventId: GlobalEventId, timeStamp: SimTime){
    super(parentEventId, 'AddActorLocalEvent', timeStamp);
  }

  // TODO !!! create actor from parameters
  applyStateUpdate(state: MainSimulationState): void {
    const acs = new Actor('ACS', 'adasd', 'ACS');
    state.getInternalStateObject().actors.push(acs);
    const mcs = new Actor('MCS', 'adasd', 'MCS');
    state.getInternalStateObject().actors.push(mcs);
  }

}
