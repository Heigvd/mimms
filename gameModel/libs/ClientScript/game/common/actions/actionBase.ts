import { GlobalEventId, LocalEventId, SimDuration, SimTime, TranslationKey } from "../baseTypes";
import { IClonable } from "../interfaces";
import * as MainSimulationState from "../simulationState/mainSimulationState";

export type ActionStatus = 'Planned' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined


/**
 * Instanciated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase implements IClonable {

  public readonly StartTime : SimTime;
  
  protected static slogger = Helpers.getLogger("actions-logger");

  protected logger = ActionBase.slogger;

  protected status : ActionStatus;

  protected readonly eventId: LocalEventId;

  public constructor(startSimTime : SimTime, evtId: LocalEventId) {
    this.StartTime = startSimTime;
    this.eventId = evtId;
  }

  abstract clone(): this;

  /**
   * Will update the given status
   * @param state the current state that will be updated
   * @param simTime
   */
  public abstract update(state: Readonly<MainSimulationState.MainSimulationState>, simTime: SimTime): void;

  public abstract duration(): number;

  /**
   * @returns True if cancellation could be applied
   */
  public cancel(): boolean {
    if(this.status === "Cancelled") {
      this.logger.warn('This action was cancelled already');
    }else if(this.status === 'Completed'){
      this.logger.error('This action is completed, it cannot be cancelled');
      return false;
    }
    return true;
  }


  public getStatus(): ActionStatus {
    return this.status;
  }

}


/**
 * An action that has a fixed duration and only start and finish effects
 */
export abstract class StartEndAction extends ActionBase {

  protected readonly durationSec;

  // TODO build from incoming event (or in a factory class)

  public constructor(startTimeSec: SimTime, durationSeconds: SimDuration, evtId: LocalEventId){
    super(startTimeSec, evtId);
    this.durationSec = durationSeconds;
  }

  protected abstract dispatchInitEvents(state: MainSimulationState.MainSimulationState): void;
  protected abstract dispatchEndedEvents(state: MainSimulationState.MainSimulationState): void;

  public update(state: MainSimulationState.MainSimulationState, simTime: SimDuration): void {

    switch(this.status){
      case 'Cancelled':
      case 'Completed':

        return;
      case 'Planned': {
        if(simTime >= this.StartTime){ // if action did start
          this.logger.debug('dispatching start events...');
          this.dispatchInitEvents(state);
          this.status = "OnGoing";
        }
      }
      break;
      case 'OnGoing': { 
        if(simTime >= this.StartTime + this.duration()){ // if action did end
          this.logger.debug('dispatching end events...');
          this.status = "Completed";
        }
      }
      break;
      default:
        this.logger.error('Undefined status cannot update action')
    }

  }

  public duration(): number {
    return this.durationSec;
  }


}

export class GetInformationAction extends StartEndAction {

  /**
   * Translation key to the message received at the end of the action
   */
  public readonly messageKey: TranslationKey;
  /**
   * Translation key for the name of the action (displayed in the timeline)
   */
  public readonly actionNameKey: TranslationKey;

  constructor (startTimeSec: SimTime, durationSeconds: SimDuration, messageKey: TranslationKey, actionNameKey: TranslationKey, evtId: GlobalEventId){
    super(startTimeSec, durationSeconds, evtId);
    this.messageKey = messageKey;
    this.actionNameKey = actionNameKey;
  }

  protected dispatchInitEvents(state: MainSimulationState.MainSimulationState): void {
    this.logger.info('start event GetInformationAction');
  }

  protected dispatchEndedEvents(state: MainSimulationState.MainSimulationState): void {
    // TODO dispatch event that will modify state to add a radio message
    this.logger.info('end event GetInformationAction');
    
    throw new Error("Method not implemented.");
  }

  override clone(): this {
    return new GetInformationAction(this.StartTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId) as this;
  }

}

export class DefineMapAction extends StartEndAction {

  clone(): this {
    throw new Error("Method not implemented.");
  }

  protected dispatchInitEvents(state: MainSimulationState.MainSimulationState): void {
    // Dispatch local event such that interface to select a point or draw geometry should open
  }

  protected dispatchEndedEvents(state: MainSimulationState.MainSimulationState): void {
    // TODO dispatch event that will modify state to add a radio message
    throw new Error("Method not implemented.");
  }

}