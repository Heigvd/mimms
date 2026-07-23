import { ActorId, GlobalEventId, SimTime } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { isTimeForwardReady, updateCurrentTimeFrame } from '../simulationState/timeState';
import { evaluateAllTriggers } from '../triggers/trigger';
import { getLocalEventManager } from './localEventManager';
import {
  registerHideInactiveActorWarning,
  registerOpenSelectedActorPanelAfterMove,
} from '../../../gameInterface/afterUpdateCallbacks';
import { TimeSliceDuration } from '../constants';
import { computeNewPatientsState } from '../patients/handleState';
import * as TaskState from '../simulationState/taskStateAccess';
import { LocalEventBase, SourceType } from './localEventBase';

export abstract class TimeForwardLocalBaseEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly priority?: number;
      readonly type: string;
      readonly actors: ActorId[];
    },
  ) {
    const defaultProps = { priority: 1 };
    super({ ...defaultProps, ...props });
  }

  protected updateCurrentTimeFrame(state: MainSimulationState, modifier: number) {
    updateCurrentTimeFrame(state, this.props.actors, modifier, this.props.simTimeStamp);
  }
}

/**
 * When applied to state, bumps the readiness of the provided actors.
 * If all actors are ready, time forwards
 */
export class TimeForwardLocalEvent extends TimeForwardLocalBaseEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly actors: ActorId[];
      readonly timeJump: number;
    },
  ) {
    super({ ...extensionProps, type: 'TimeForwardLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    this.updateCurrentTimeFrame(state, 1);
    if (isTimeForwardReady(state)) {
      state.incrementSimulationTime(this.extensionProps.timeJump);

      // update patients
      this.updatePatients(state, this.extensionProps.timeJump);

      // update all actions
      this.updateActions(state);

      // update all tasks
      this.updateTasks(state);

      // run the triggers
      const generatedLocalEvents = evaluateAllTriggers(state);
      getLocalEventManager().queueLocalEvents(generatedLocalEvents);

      registerOpenSelectedActorPanelAfterMove();
      registerHideInactiveActorWarning();

      state.updateForwardTimeFrame();

      // auto-continue if all actors are still awaiting
      if (isTimeForwardReady(state)) {
        const tfw = new TimeForwardLocalEvent({
          parentEventId: this.extensionProps.parentEventId,
          source: this.extensionProps.source,
          simTimeStamp: state.getSimTime(),
          actors: [],
          timeJump: TimeSliceDuration,
        });
        getLocalEventManager().queueLocalEvent(tfw);
      }
    }
  }

  private updatePatients(state: MainSimulationState, timeJump: number) {
    const patients = state.getInternalStateObject().patients;
    computeNewPatientsState(patients, timeJump);
  }

  private updateActions(state: MainSimulationState) {
    state.getInternalStateObject().actions.forEach(a => a.update(state));
  }

  private updateTasks(state: MainSimulationState) {
    TaskState.getAllTasks(state).forEach(t => t.update(state, this.extensionProps.timeJump));
  }
}