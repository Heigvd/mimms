import { GlobalEventId, SimTime } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { isTimeForwardReady } from '../simulationState/timeState';
import { evaluateAllTriggers } from '../triggers/trigger';
import { getLocalEventManager } from './localEventManager';
import { TimeSliceDuration } from '../constants';
import { computeNewPatientsState } from '../patients/handleState';
import * as TaskState from '../simulationState/taskStateAccess';
import { LocalEventBase, SourceType } from './localEventBase';

/**
 * When applied to state, checks if on site actors can still plan or no.
 * If all actors have planned and action, time forwards.
 */
export class TimeForwardRequestLocalEvent extends LocalEventBase {
  private readonly ignoreConditions: boolean;

  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly timeJump: number;
      readonly ignoreConditions?: boolean;
    }
  ) {
    super({ ...props, type: 'TimeForwardLocalEvent', priority: 1 });
    this.ignoreConditions = props.ignoreConditions || false;
  }

  applyStateUpdate(state: MainSimulationState): void {
    if (isTimeForwardReady(state) || this.ignoreConditions) {
      state.incrementSimulationTime(this.props.timeJump);

      // update patients
      this.updatePatients(state, this.props.timeJump);

      // update all actions
      this.updateActions(state);

      // update all tasks
      this.updateTasks(state);

      // run the triggers
      const generatedLocalEvents = evaluateAllTriggers(state);
      getLocalEventManager().queueLocalEvents(generatedLocalEvents);

      // Creates new request to check again
      const tfw = new TimeForwardRequestLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: state.getSimTime(),
        timeJump: TimeSliceDuration,
      });

      getLocalEventManager().queueLocalEvent(tfw);
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
    TaskState.getAllTasks(state).forEach(t => t.update(state, this.props.timeJump));
  }
}
