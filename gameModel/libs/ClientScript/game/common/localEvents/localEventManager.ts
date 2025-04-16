import { Heap } from '../../../tools/heap';
import { localEventManagerLogger } from '../../../tools/logger';
import { getCurrentExecutionContext } from '../../../executionContext/gameExecutionContextController';
import { SimTime } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { compareLocalEvents, LocalEventBase } from './localEventBase';

/**
 * Manages all the local events
 */
export class LocalEventManager {
  private readonly pendingEvents: Heap<LocalEventBase>;
  private readonly processedEvents: LocalEventBase[] = [];

  constructor() {
    this.pendingEvents = new Heap(compareLocalEvents);
  }

  public queueLocalEvent(event: LocalEventBase) {
    this.pendingEvents.insert(event);
  }

  public queueLocalEvents(events: LocalEventBase[]) {
    events.forEach(e => this.queueLocalEvent(e));
  }

  public processPendingEvents(
    state: MainSimulationState,
    lastEventId: number
  ): MainSimulationState {
    let safeguard = 0;
    const newState = state.createNext(lastEventId);

    while (this.hasPendingEvent(newState.getSimTime()) && safeguard <= 200) {
      const nextEvent = this.pendingEvents.extract()!;
      newState.applyEvent(nextEvent);
      this.processedEvents.push(nextEvent);
      safeguard++;
    }

    if (safeguard >= 200) {
      localEventManagerLogger.error(
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

export function getLocalEventManager(): LocalEventManager {
  localEventManagerLogger.debug('Getting localEventManager');
  return getCurrentExecutionContext().getLocalEventManager();
}
