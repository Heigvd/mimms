import { ActorId, GlobalEventId, SimTime, TranslationKey } from "../baseTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { LocalEventBase } from "./localEventBase";

export class AddRadioMessageLocalEvent extends LocalEventBase {

  constructor(
    parentId: GlobalEventId,
    timeStamp: SimTime,
    public readonly recipient: ActorId, 
    public readonly emitter: TranslationKey,
    public readonly message: TranslationKey)
  {
      super(parentId, 'AddLogMessageLocalEvent', timeStamp);
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.getInternalStateObject().radioMessages.push({
      recipientId: this.recipient,
      timeStamp: this.simTimeStamp,
      emitter: this.emitter,
      message: this.message,
    })
  }

}