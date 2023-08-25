import { OnTheRoadgAction } from "../actions/actionBase";
import { Actor } from "../actors/actor";
import { GlobalEventId, SimTime } from "../baseTypes";
import { TimeSliceDuration } from "../constants";
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
    const acsAction = new OnTheRoadgAction(0, TimeSliceDuration * 3, 'message-key', 'on the road', 0, acs.Uid);
    state.getInternalStateObject().actions.push(acsAction);
    const mcs = new Actor('MCS', 'adasd', 'MCS');
    state.getInternalStateObject().actors.push(mcs);
    const mcsAction = new OnTheRoadgAction(0, TimeSliceDuration * 3, 'message-key', 'on the road', 0, mcs.Uid);
    state.getInternalStateObject().actions.push(mcsAction);
  }

}
