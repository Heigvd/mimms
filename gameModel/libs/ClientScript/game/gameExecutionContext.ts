import { mainSimLogger } from '../tools/logger';
import { TimedEventPayload } from './common/events/eventTypes';
import { compareTimedEvents, FullEvent } from './common/events/eventUtils';
import { LocalEventBase } from './common/localEvents/localEventBase';
import { LocalEventManager } from './common/localEvents/localEventManager';
import { getStartingMainState } from './common/simulationState/loaders/mainStateLoader';
import { MainSimulationState } from './common/simulationState/mainSimulationState';

export type TeamId = number;
export type GlobalToLocalEventFunction = (evt: FullEvent<TimedEventPayload>) => LocalEventBase[];

export class GameExecutionContext {
  private stateHistory: MainSimulationState[] = [];
  private readonly processedEvents: Record<string, FullEvent<TimedEventPayload>> = {};
  private readonly localEventManager: LocalEventManager;

  constructor(public readonly teamId: TeamId, public readonly eventBoxId: number) {
    this.localEventManager = new LocalEventManager();
    this.updateCurrentState(getStartingMainState());
  }

  private updateCurrentState(newState: MainSimulationState): void {
    this.stateHistory.push(newState);
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

  public processEvents(
    globalEvents: FullEvent<TimedEventPayload>[],
    conversionFunc: GlobalToLocalEventFunction
  ): void {
    // filter out non processed events
    const unprocessed = globalEvents.filter(e => !this.processedEvents[e.id]);
    const sorted = unprocessed.sort(compareTimedEvents);

    // process all candidate events
    sorted.forEach(event => {
      mainSimLogger.info('Processing event ', event);
      this.processEvent(event, conversionFunc);
    });
  }

  /**
   * Restore a previous state to a given state count value
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
      if (newState.stateCount !== currentState?.stateCount) {
        mainSimLogger.info('updating current state', newState.stateCount);
        this.updateCurrentState(newState);
      }
    } catch (error) {
      mainSimLogger.error('Error while processing event', event, error);
    }

    this.processedEvents[event.id] = event;
  }

  public getLocalEventManager(): LocalEventManager {
    return this.localEventManager;
  }
}
