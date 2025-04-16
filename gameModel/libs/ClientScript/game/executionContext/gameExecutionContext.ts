import { mainSimLogger } from '../../tools/logger';
import { TimedEventPayload } from '../common/events/eventTypes';
import { compareTimedEvents, FullEvent } from '../common/events/eventUtils';
import { IClonable } from '../common/interfaces';
import { LocalEventBase } from '../common/localEvents/localEventBase';
import { LocalEventManager } from '../common/localEvents/localEventManager';
import { MainSimulationState } from '../common/simulationState/mainSimulationState';

export type TeamId = number;
export type GlobalToLocalEventFunction = (evt: FullEvent<TimedEventPayload>) => LocalEventBase[];

export class GameExecutionContext {
  private stateHistory: MainSimulationState[] = [];
  private readonly processedEvents: Record<string, FullEvent<TimedEventPayload>> = {};
  private readonly localEventManager: LocalEventManager;
  private readonly uidProvider: UidGenerator;

  constructor(
    public readonly teamId: TeamId,
    public readonly eventBoxId: number,
    initialState: MainSimulationState,
    uidGenerator: UidGenerator
  ) {
    this.localEventManager = new LocalEventManager();
    this.uidProvider = uidGenerator;
    this.updateCurrentState(initialState);
  }

  private updateCurrentState(newState: MainSimulationState): void {
    this.stateHistory.push(newState);
  }

  private getLastEventId(): number {
    return this.getCurrentState().getLastEventId();
  }

  public getCurrentState(): MainSimulationState {
    const current = this.stateHistory[this.stateHistory.length - 1];
    if (current) {
      return current;
    }
    throw new Error('Could not get current state for team ' + this.teamId);
  }

  public getStateHistory(): MainSimulationState[] {
    return this.stateHistory;
  }

  /**
   * returns true if the events could be processed
   * false if the last event id doesn't match the first event to be applied
   */
  public processEvents(
    globalEvents: FullEvent<TimedEventPayload>[],
    conversionFunc: GlobalToLocalEventFunction
  ): boolean {
    // filter out non processed events
    const unprocessed = globalEvents.filter(e => !this.processedEvents[e.id]);
    const sorted = unprocessed.sort(compareTimedEvents);

    if (sorted.length > 0) {
      // check that the first event to be applied matches the state
      const firstEvent = sorted[0];
      if ((firstEvent?.previousEventId || 0) !== this.getLastEventId()) {
        mainSimLogger.warn(
          "received event doesn't match the current state",
          firstEvent?.previousEventId,
          this.getLastEventId()
        );
        return false;
      }
    }
    // process all candidate events
    sorted.forEach(event => {
      mainSimLogger.info('Processing event ', event);
      this.processEvent(event, conversionFunc);
    });
    return true;
  }

  /**
   * Restores a previous state to a given state count value
   * ignored if the state count doesn't exist
   */
  public restoreState(stateId: number): void {
    const idx = this.stateHistory.findIndex(s => s.stateCount == stateId);
    if (idx < 0) {
      mainSimLogger.error('state not found, cannot restore state with id', stateId);
    } else {
      this.stateHistory = this.stateHistory.slice(0, idx + 1);
    }
  }

  /**
   * Processes one global event and computes a new resulting state
   * The new state is appended to the history
   * The event is ignored if it doesn't match with the current simulation time
   * @param event the global event to process
   */
  private processEvent(
    event: FullEvent<TimedEventPayload>,
    conversionFunc: GlobalToLocalEventFunction
  ): void {
    const currentState = this.getCurrentState();
    const now = currentState.getSimTime();
    if (!event.payload.dashboardForced) {
      if (event.payload.triggerTime < now) {
        mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
        mainSimLogger.warn(
          'Likely due to a TimeForwardEvent that has jumped over an existing event => BUG'
        );
        return;
      } else if (event.payload.triggerTime > now) {
        mainSimLogger.warn(`current sim time ${now}, ignoring event : `, event);
        mainSimLogger.warn('This event will be processed later');
        return;
      }
    } else {
      // from trainer
      mainSimLogger.info('Trainer event', event);
      event.payload.triggerTime = now;
    }

    try {
      const localEvents = conversionFunc(event);
      this.getLocalEventManager().queueLocalEvents(localEvents);
      const newState = this.getLocalEventManager().processPendingEvents(currentState, event.id);
      mainSimLogger.info(
        'Updated state (count, lastEventId)',
        newState.stateCount,
        newState.getLastEventId()
      );
      this.updateCurrentState(newState);
    } catch (error) {
      mainSimLogger.error('Error while processing event', event, error);
    }

    this.processedEvents[event.id] = event;
  }

  public getLocalEventManager(): LocalEventManager {
    return this.localEventManager;
  }

  public getUidProvider(): UidGenerator {
    return this.uidProvider;
  }
}

export class UidGenerator implements IClonable {
  constructor(readonly generators: Record<string, number>) {}

  clone(): this {
    return new UidGenerator(this.generators) as this;
  }

  /** gets next value for class name, if not existing the default value is registered*/
  public getNext(className: string, defaultValue: number): number {
    if (!this.generators[className]) {
      this.generators[className] = defaultValue;
    }
    return ++this.generators[className];
  }
}
