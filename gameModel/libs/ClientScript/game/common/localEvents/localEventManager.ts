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

  public processPendingEvents(state: MainSimulationState): MainSimulationState {
    let safeguard = 0;
    let pending: LocalEventBase[] = [];
    let newState = state;

    pending = this.getPendingEvents(newState.getSimTime());

    while (pending.length > 0 && safeguard <= 10) {
      // we might as well apply event by event and store each single change
      newState = newState.applyEvents(pending);
      this.processedEvents.push(...pending);
      pending = this.getPendingEvents(newState.getSimTime());
      safeguard++;
    }

    if (safeguard >= 10) {
      this.logger.error(
        'Too much event generations, might be an infinite event generation. Stopping',
      );
    }

    return newState;
  }

  private getPendingEvents(currentTime: SimTime): LocalEventBase[] {
    const events: LocalEventBase[] = [];
    while (this.pendingEvents.peek() && this.pendingEvents.peek()!.simTimeStamp <= currentTime) {
      const e = this.pendingEvents.extract()!;
      if (e.simTimeStamp < currentTime) {
        this.logger.error(
          `Current time = ${currentTime}, this event happened in the past, ignoring`,
          e,
        );
      }
      events.push(e);
    }

    return events;
  }
}

// will be initialized as soon as all scripts have been evaluated
export let localEventManager: LocalEventManager = undefined as unknown as LocalEventManager;
Helpers.registerEffect(() => {
  localEventManager = new LocalEventManager();
});
