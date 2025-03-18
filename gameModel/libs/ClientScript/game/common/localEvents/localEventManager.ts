import { Heap } from '../../../tools/heap';
import { localEventManagerLogger } from '../../../tools/logger';
import { SimTime } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { compareLocalEvents, LocalEventBase } from './localEventBase';

/**
 * Manages all the local events
 */
export class LocalEventManager {
  private readonly logger = localEventManagerLogger;
  private readonly pendingEvents: Heap<LocalEventBase>;
  private readonly processedEvents: LocalEventBase[] = [];

  constructor() {
    this.pendingEvents = new Heap(compareLocalEvents);
  }

  public queueLocalEvent(event: LocalEventBase) {
    this.pendingEvents.insert(event);
  }

  public processPendingEvents(state: MainSimulationState, eventId: number): MainSimulationState {
    let safeguard = 0;
    let newState = state.clone();

    while (this.hasPendingEvent(newState.getSimTime()) && safeguard <= 200) {
      const nextEvent = this.pendingEvents.extract()!;
      newState.applyEvent(nextEvent, eventId);
      this.processedEvents.push(nextEvent);
      safeguard++;
    }

    if (safeguard >= 200) {
      this.logger.error(
        'Too much event generations, might be an infinite event generation. Stopping'
      );
    }

    return newState;
  }

  private hasPendingEvent(currentTime: SimTime): boolean {
    if (this.pendingEvents.peek()) {
      return this.pendingEvents.peek()!.simTimeStamp <= currentTime;
    }
    return false;
  }

  public getProcessedEvents(): Readonly<LocalEventBase[]> {
    return this.processedEvents;
  }
}

// will be initialized as soon as all scripts have been evaluated
let localEventManager: LocalEventManager = undefined as unknown as LocalEventManager;
Helpers.registerEffect(() => {
  localEventManager = new LocalEventManager();
});

// TODO get from proper context
export function getLocalEventManager(): LocalEventManager {
  return localEventManager;
}
