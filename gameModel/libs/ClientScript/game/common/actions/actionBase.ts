import { MappableById } from "../../../tools/mapById";
import { ActorId, GlobalEventId, LocalEventId, SimDuration, SimTime, TranslationKey } from "../baseTypes";
import { IClonable } from "../interfaces";
import { AddRadioMessageLocalEvent } from "../localEvents/AddLogMessageLocalEvent";
import { AddMapItemLocalEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";

export type ActionStatus = 'Planned' | 'Cancelled' | 'OnGoing' | 'Completed' | undefined


/**
 * Instanciated action that lives in the state of the game and will generate local events that will change the game state
 */
export abstract class ActionBase implements IClonable, MappableById<ActorId> {

  protected static slogger = Helpers.getLogger("actions-logger");

  protected readonly logger = ActionBase.slogger;

  protected status : ActionStatus;

  public constructor(
    readonly startTime : SimTime, 
    protected readonly eventId: GlobalEventId,
    public readonly ownerId: ActorId) 
  { }

  id(): ActorId {
    return this.ownerId;
  }

  abstract clone(): this;

  /**
   * Will update the given status
   * @param state the current state that will be updated
   * @param simTime
   */
  public abstract update(state: Readonly<MainSimulationState>): void;

  public abstract duration(): SimDuration;

  /**
   * TODO could be a pure function that just returns a cloned instance
   * @returns True if cancellation could be applied
   */
  public cancel(): boolean {
    if(this.status === "Cancelled") {
      this.logger.warn('This action was cancelled already');
    }else if(this.status === 'Completed'){
      this.logger.error('This action is completed, it cannot be cancelled');
      return false;
    }
    this.status = 'Cancelled';
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

  public constructor(startTimeSec: SimTime, durationSeconds: SimDuration, evtId: GlobalEventId, ownerId: ActorId){
    super(startTimeSec, evtId, ownerId);
    this.durationSec = durationSeconds;
  }

  protected abstract dispatchInitEvents(state: MainSimulationState): void;
  protected abstract dispatchEndedEvents(state: MainSimulationState): void;

  public update(state: MainSimulationState): void {

    const simTime = state.getSimTime();
    switch(this.status){
      case 'Cancelled':
      case 'Completed':

        return;
      case 'Planned': {
        if(simTime >= this.startTime){ // if action did start
          this.logger.debug('dispatching start events...');
          this.dispatchInitEvents(state);
          this.status = "OnGoing";
        }
      }
      break;
      case 'OnGoing': { 
        if(simTime >= this.startTime + this.duration()){ // if action did end
          this.logger.debug('dispatching end events...');
          this.dispatchEndedEvents(state);
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

  constructor (startTimeSec: SimTime, durationSeconds: SimDuration, messageKey: TranslationKey, actionNameKey: TranslationKey, evtId: GlobalEventId, ownerId: ActorId){
    super(startTimeSec, durationSeconds, evtId, ownerId);
    this.messageKey = messageKey;
    this.actionNameKey = actionNameKey;
  }

  protected dispatchInitEvents(state: Readonly<MainSimulationState>): void {
    //likely nothing to do
    this.logger.info('start event GetInformationAction');
  }

  protected dispatchEndedEvents(state: Readonly<MainSimulationState>): void {
    this.logger.info('end event GetInformationAction');
    localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(this.eventId, this.startTime, this.ownerId, this.messageKey));
  }

  override clone(): this {
    const clone = new GetInformationAction(this.startTime, this.durationSec, this.messageKey, this.actionNameKey, this.eventId, this.ownerId);
    clone.status = this.status;
    return clone as this;
  }

}

export class DefineMapObjectAction extends StartEndAction {

  clone(): this {
    throw new Error("Method not implemented.");
  }

  protected dispatchInitEvents(state: MainSimulationState): void {
    // dispatch state changes that take place immediatly
    // TODO show grayed out map element
    localEventManager.queueLocalEvent(new AddMapItemLocalEvent(this.eventId, state.getSimTime(), 'todo'));
    throw new Error("Method not implemented.");
  }

  protected dispatchEndedEvents(state: MainSimulationState): void {
    // dispatch state changes that take place at the end of the action
    // ungrey the map element
    throw new Error("Method not implemented.");
  }

}