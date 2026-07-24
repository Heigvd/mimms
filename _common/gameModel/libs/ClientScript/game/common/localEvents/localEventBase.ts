// EVALUATION_PRIORITY 10

import { mainSimLogger } from '../../../tools/logger';
import { ActionBase } from '../actions/actionBase';
import { GlobalEventId, SimTime, TaskId } from '../baseTypes';
import { GameOptions } from '../gameOptions';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { changePatientLocation, PatientLocation } from '../simulationState/patientState';
import * as TaskState from '../simulationState/taskStateAccess';
import { TaskBase, TaskStatus } from '../tasks/taskBase';
import { evaluateAllTriggers, Trigger } from '../triggers/trigger';
import { getLocalEventManager } from './localEventManager';

export interface LocalEvent {
  type: string;
  /**
   * The Global Event that causes this local event
   */
  parentEventId: GlobalEventId;
  /**
   * The agent is of the object that triggered this event
   * Can be either an action, a trigger or a task.
   */
  source: SourceType;
  /**
   * SimTime at which this happens in seconds from ambulance arrival
   */
  simTimeStamp: SimTime;
  /**
   *
   */
  priority?: number; // The smaller priority is the first to be processed
}

export type SourceType =
  | {
      type: 'initialisation' | 'trainer' | 'time-forward' | 'plan-action' | 'unplan-action';
    }
  | {
      type: 'action';
      id: ActionBase['Uid'];
    }
  | {
      type: 'trigger';
      id: Trigger['uid'];
    }
  | {
      type: 'task';
      id: TaskBase['Uid'];
    };

export abstract class LocalEventBase {
  private static eventCounter = 0;

  /**
   * Used for ordering
   */
  public readonly eventNumber: number;

  readonly type: string;
  readonly parentEventId: GlobalEventId;
  readonly source: SourceType;
  readonly simTimeStamp: number;
  readonly priority: number;

  protected constructor(props: LocalEvent) {
    this.type = props.type;
    this.parentEventId = props.parentEventId;
    this.source = props.source;
    this.simTimeStamp = props.simTimeStamp;
    this.priority = props.priority ?? 0;

    this.eventNumber = LocalEventBase.eventCounter++;
  }

  /**
   * Applies the effects of this event to the state
   * @param state In this function, state changes are allowed
   */
  abstract applyStateUpdate(state: MainSimulationState): void;
}

/**
 * @param e1
 * @param e2
 * @returns true if e1 precedes e2, ordering by timestamps (trigger time)
 * if equal timestamps priority is used instead
 * if equal priority order (eventCounter) is used instead
 */
export function compareLocalEvents(e1: LocalEventBase, e2: LocalEventBase): boolean {
  if (e1.simTimeStamp === e2.simTimeStamp) {
    if (e1.priority === e2.priority) {
      return e1.eventNumber < e2.eventNumber;
    }
    return e1.priority < e2.priority;
  }
  return e1.simTimeStamp < e2.simTimeStamp;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// action
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

// immutable
/**
 * Creates an action to be inserted in the timeline and inits it
 */
export class PlanActionLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly action: ActionBase;
    }
  ) {
    super({ ...props, type: 'PlanActionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    so.actions.push(this.props.action);
    // init action
    this.props.action.update(state);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// EMERGENCY DEPARTMENT - RESOURCE ARRIVAL
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// TASKS
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class TaskStatusChangeLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly taskId: TaskId;
      readonly status: TaskStatus;
    }
  ) {
    super({ ...props, type: 'TaskStatusChangeLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    TaskState.changeTaskStatus(state, this.props.taskId, this.props.status);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// PATIENT
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class MovePatientLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly patientId: string;
      readonly location: PatientLocation;
    }
  ) {
    super({ ...props, type: 'MovePatientLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    changePatientLocation(state, this.props.patientId, this.props.location);
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// GAME OPTIONS
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export class GameOptionsUpdateLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly options: GameOptions;
    }
  ) {
    super({ ...props, type: 'GameOptionsUpdateLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    state.getInternalStateObjectUnsafe().gameOptions = this.props.options;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * This local event is to be emitted and evaluated right after the creation of an evaluation context
 */
export class T0TriggerEvaluationLocalEvent extends LocalEventBase {
  constructor() {
    super({
      type: 'T0TriggerEvaluationLocalEvent',
      parentEventId: 0, // TODO check
      source: { type: 'initialisation' },
      simTimeStamp: 0,
    });
  }

  applyStateUpdate(state: MainSimulationState): void {
    if (state.getLastEventId() === 0) {
      getLocalEventManager().queueLocalEvents(evaluateAllTriggers(state));
    } else {
      mainSimLogger.warn(
        'Ignoring the T0 trigger evaluation event. It is only applied on the initial state',
        state.getLastEventId()
      );
    }
  }
}
