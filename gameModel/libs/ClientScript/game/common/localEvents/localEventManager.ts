import { Heap } from "../../../tools/heap";
import { localEventManagerLogger} from "../../../tools/logger";
import { SimTime } from "../baseTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { compareLocalEvents, LocalEvent, LocalEventBase } from "./localEventBase";

/**
 * Manages all the local events
 */
export class LocalEventManager {

  private readonly logger = localEventManagerLogger;
  private readonly pendingEvents : Heap<LocalEventBase>;
  private readonly processedEvents: LocalEventBase[] = [];
  // TODO figure out best data structure
  // TODO certainly one heap for pending and a record by ts for processed ones

  constructor() {
    this.pendingEvents = new Heap(compareLocalEvents);
  }

  public queueLocalEvent(event: LocalEventBase){
    this.pendingEvents.insert(event);
  }

  public processPendingEvents(state: MainSimulationState): MainSimulationState{
    // while there are pending events
    let safeguard = 0;
    let pending : LocalEventBase[] = [];
    let newState = state;

    do{
      safeguard++;
      // TODO get main state apply to state

      pending = this.getPendingEvents(newState.getSimTime());
      // TODO apply events figure out if logic goes there 
      // we might as well apply event by event and store each single change
      newState = state.applyEvents(pending);
      this.processedEvents.concat(pending);

    } while( safeguard <= 10 && pending.length > 0);
    
    if(safeguard >= 10){
      this.logger.error('Too much event generations, might be an infinite event generation. Stopping')
    }

    return newState;
  }

  private getPendingEvents(currentTime: SimTime): LocalEventBase[] {
    const events: LocalEventBase[] = [];

    while(this.pendingEvents.peek() && this.pendingEvents.peek()!.simTimeStamp <= currentTime){
      const e = this.pendingEvents.extract();
      if(e.simTimeStamp < currentTime){
        this.logger.error(`Current time = ${currentTime}, this event happened in the past, ignoring`, e);
      }
      events.push(e);
    }
    return events;
  }

}

export const localEventManager = new LocalEventManager();//Helpers.useRef<LocalEventManager>('local-event-manager', new LocalEventManager());

