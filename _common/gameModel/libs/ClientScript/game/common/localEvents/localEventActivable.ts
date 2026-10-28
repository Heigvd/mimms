import { LocalEventBase, SourceType } from './localEventBase';
import { GlobalEventId, SimTime } from '../baseTypes';
import { Uid } from '../interfaces';
import { ActivationOperator } from '../impacts/implementation/activationImpact';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { Activable, ChoiceActivable, getChoiceActivable } from '../simulationState/activableState';
import { activableLogger } from '../../../tools/logger';
import { BuildStatus } from '../mapEntities/mapEntityDescriptor';

/**
 * Change the active status of an activable
 */
export class ChangeActivableStatusLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly target: Uid;
      readonly option: ActivationOperator;
    }
  ) {
    super({ ...props, type: 'ChangeActivableStatusLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    const target: Activable | undefined = so.activables[this.props.target];
    if (target != undefined) {
      if (this.props.option === 'activate') {
        target.active = true;
      } else if (this.props.option === 'deactivate') {
        target.active = false;
      } else {
        activableLogger.error('Unhandled option for changing an activable status', this.props);
      }
    } else {
      activableLogger.error('Could not find activable', this.props);
    }
  }
}

export class ChangeMapActivableStatusLocalEvent extends ChangeActivableStatusLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly target: Uid;
      readonly option: ActivationOperator;
    },
    readonly buildStatus: BuildStatus
  ) {
    super({ ...extensionProps });
  }

  override applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    const target: Activable | undefined = so.activables[this.props.target];
    if (target != undefined && target.activableType === 'mapEntity') {
      target.buildStatus = this.buildStatus;
      if (this.props.option === 'activate') {
        target.active = true;
      } else if (this.props.option === 'deactivate') {
        target.active = false;
      } else {
        activableLogger.error('Unhandled option for changing an activable status', this.props);
      }
    } else {
      activableLogger.error('Could not find activable', this.props);
    }
  }
}

/**
 * Change the number of times that a trigger / action template / choice what run
 */
export class IncrementCountLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly target: Uid;
    }
  ) {
    super({ ...props, type: 'IncrementCountLocalEvent' });
  }

  override applyStateUpdate(state: MainSimulationState): void {
    const so = state.getInternalStateObject();
    const target: Activable | undefined = so.activables[this.props.target];
    if (target != undefined && target.activableType === 'trigger') {
      target.count += 1;
    }
  }
}

export class SelectChoiceEffectLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly target: Uid;
      readonly effect: Uid;
    }
  ) {
    super({ ...props, type: 'SelectChoiceEffectLocalEvent' });
  }

  override applyStateUpdate(state: MainSimulationState): void {
    const targetActivable: ChoiceActivable | undefined = getChoiceActivable(
      state,
      this.props.target
    );
    if (targetActivable) {
      targetActivable.selectedEffect = this.props.effect;
    } else {
      activableLogger.error('Could not find activable', this.props.target);
    }
  }
}
