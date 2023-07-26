import { ActorId, GlobalEventId, SimTime, TranslationKey } from "../baseTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { LocalEventBase } from "./localEventBase";

export class AddLogMessageLocalEvent extends LocalEventBase {

  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly recipient: ActorId, 
    public readonly message: TranslationKey)
  {
      super(parentId, 'AddLogMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.getInternalStateObject().radioMessages.push({
      message: this.message,
      recipientId: this.recipient,
      timeStamp: this.simTimeStamp
    })
  }

}