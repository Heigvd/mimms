import { entries, keys } from '../../../tools/helper';
import { mainSimLogger, resourceLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { ActionBase } from '../actions/actionBase';
import { getHighestAuthorityActorsByLocation } from '../actors/actorLogic';
import { ActorId, GlobalEventId, ResourceContainerDefinitionId, SimDuration, SimTime, TaskId } from '../baseTypes';
import { FailedRessourceArrivalDelay } from '../constants';
import { CasuMessagePayload, MethaneMessagePayload } from '../events/casuMessageEvent';
import { GameOptions } from '../gameOptions';
import { RadioType } from '../radio/communicationType';
import * as RadioLogic from '../radio/radioLogic';
import { getContainerDef, resolveResourceRequest } from '../resources/emergencyDepartment';
import { ResourceContainerType } from '../resources/resourceContainer';
import * as ResourceLogic from '../resources/resourceLogic';
import { resourceArrivalLocationResolution } from '../resources/resourceLogic';
import { ResourceType } from '../resources/resourceType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { changePatientLocation, PatientLocation } from '../simulationState/patientState';
import * as ResourceState from '../simulationState/resourceStateAccess';
import * as TaskState from '../simulationState/taskStateAccess';
import { TaskBase, TaskStatus } from '../tasks/taskBase';
import { evaluateAllTriggers, Trigger } from '../triggers/trigger';
import { getLocalEventManager } from './localEventManager';
import { AddActorLocalEvent } from './localEventBaseActors';
import { AddMessageLocalEvent, AddNotificationLocalEvent, AddRadioMessageLocalEvent } from './localEventBaseRadio';

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

/**
 * Takes a player formulated request and resolves it given
 * the emergency center's available resources
 */
export class ResourceRequestResolutionLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly actorUid: ActorId | undefined;
      readonly request: CasuMessagePayload;
    }
  ) {
    super({ ...props, type: 'ResourceRequestResolutionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    // check that the payload subtypes to MethaneMessagePayload
    if (this.props.request.messageType !== 'R' && this.props.request.resourceRequest) {
      resolveResourceRequest(
        state,
        this.props.parentEventId,
        this.props.source,
        this.props.actorUid,
        this.props.request.resourceRequest
      );
    }
  }
}

export class AutoSendACSMCSLocalEvent extends ResourceRequestResolutionLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
    }
  ) {
    //Request ACS-MCS
    const casuMessage: MethaneMessagePayload = {
      messageType: 'E',
      resourceRequest: {
        'ACS-MCS': 1,
        Ambulance: 0,
        SMUR: 0,
        PMA: 0,
        DPMA: 0,
        'PC-San': 0,
        Helicopter: 0,
      },
    };
    super({ ...extensionProps, actorUid: undefined, request: casuMessage });
  }

  override applyStateUpdate(state: MainSimulationState): void {
    resourceLogger.info('Force requesting ACS-MCS if needed');
    super.applyStateUpdate(state);
  }
}

/**
 * Spawned when the emergency dept sends resource containers
 */
export class ResourceMobilizationLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly departureTime: SimTime;
      readonly travelTime: SimDuration;
      readonly containerDefId: ResourceContainerDefinitionId;
      readonly amount: number;
      readonly configName: string;
    }
  ) {
    super({ ...props, type: 'ResourceMobilizationLocalEvent' });
  }

  override applyStateUpdate(_state: MainSimulationState): void {
    const containerDef = getContainerDef(this.props.containerDefId);
    // We assume that containers are well configured
    // and thus that there are no duplicates

    // actors are created right away (they need to appear in the timeline)
    // Note : Actor creation ignores the "amount" value
    containerDef.roles.forEach(role => {
      const evt = new AddActorLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: this.props.departureTime,
        role,
        travelTime: this.props.travelTime,
      });
      getLocalEventManager().queueLocalEvent(evt);
    });

    if (
      Object.keys(containerDef.resources).length > 0 ||
      Object.keys(containerDef.flags).length > 0
    ) {
      // schedule resource arrival event
      const evt = new ResourcesArrivalLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: this.props.departureTime + this.props.travelTime,
        containerDefId: this.props.containerDefId,
        amount: this.props.amount,
        squadName: this.props.configName,
      });
      getLocalEventManager().queueLocalEvent(evt);
    }
  }
}

/**
 * Resources arrival on site
 * Resources are assigned to the highest hierarchy level present by default
 */
export class ResourcesArrivalLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly containerDefId: ResourceContainerDefinitionId;
      readonly amount: number;
      readonly squadName: string;
    }
  ) {
    super({ ...props, type: 'ResourcesArrivalLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const containerDef = getContainerDef(this.props.containerDefId);

    if (ResourceLogic.resourceContainerCanArrive(state, containerDef.type)) {
      // add flags to state if any
      if (containerDef.flags) {
        containerDef.flags.forEach(f => (state.getInternalStateObject().flags[f] = true));
      }

      if (containerDef.resources) {
        const sentResourcesByLocations: Partial<
          Record<LOCATION_ENUM, Partial<Record<ResourceType, number>>>
        > = {};

        entries(containerDef.resources)
          .filter(([_resourceType, qty]) => qty && qty > 0)
          .forEach(([resourceType, qty]) => {
            const resourcesAmount = qty! * this.props.amount;
            const location: LOCATION_ENUM = resourceArrivalLocationResolution(state, resourceType);

            if (!sentResourcesByLocations[location]) {
              sentResourcesByLocations[location] = {};
            }
            sentResourcesByLocations[location]![resourceType] = resourcesAmount;

            ResourceState.addIncomingResources(state, resourceType, resourcesAmount, location);
          });

        keys(sentResourcesByLocations).forEach((location: LOCATION_ENUM) => {
          const greetingActors = getHighestAuthorityActorsByLocation(state, location);

          greetingActors.forEach((actorId: ActorId) => {
            getLocalEventManager().queueLocalEvent(
              new ResourceArrivalAnnouncementLocalEvent({
                parentEventId: this.props.parentEventId,
                source: this.props.source,
                simTimeStamp: this.props.simTimeStamp,
                recipientActor: actorId,
                resources: sentResourcesByLocations[location]!,
              })
            );
          });
        });
      }
    } else {
      // missing ambulance or helicopter park location
      // radio message to the user
      getLocalEventManager().queueLocalEvent(
        this.buildArrivalFailureRadioEvent(containerDef.type, state)
      );
      // TODO later : we might want to make the ressources arrive as soon as the park is defined
      // TODO if more than one container of a given type fails, do we want to aggregate the warning messages?
      // try again X minutes later
      getLocalEventManager().queueLocalEvent(
        new ResourcesArrivalLocalEvent({
          parentEventId: this.props.parentEventId,
          source: this.props.source,
          simTimeStamp: this.props.simTimeStamp + FailedRessourceArrivalDelay,
          containerDefId: this.props.containerDefId,
          amount: this.props.amount,
          squadName: this.props.squadName,
        })
      );
    }
  }

  private buildArrivalFailureRadioEvent(
    rtype: ResourceContainerType,
    state: MainSimulationState
  ): AddMessageLocalEvent {
    let parkKey = '';
    if (rtype === 'Ambulance') parkKey = 'location-ambulancePark';
    else if (rtype === 'Helicopter') parkKey = 'location-helicopterPark';
    else
      resourceLogger.warn('The ressources that are unable to arrive are ambulance and helicopter');
    const park = getTranslation('mainSim-locations', parkKey, false);
    const message = getTranslation('mainSim-locations', 'missingLocation', true, [
      park,
      this.props.squadName,
    ]);
    return new AddRadioMessageLocalEvent({
      parentEventId: this.props.parentEventId,
      source: this.props.source,
      simTimeStamp: state.getSimTime(),
      senderName: this.props.squadName,
      message,
      channel: RadioType.CASU,
      omitTranslation: true,
    });
  }
}

export class ResourceArrivalAnnouncementLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly recipientActor: ActorId;
      readonly resources: Partial<Record<ResourceType, number>>;
    }
  ) {
    super({ ...props, type: 'ResourceArrivalAnnouncementLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    getLocalEventManager().queueLocalEvent(
      new AddNotificationLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: state.getSimTime(),
        senderName: RadioLogic.getResourceAsSenderName(),
        recipientId: this.props.recipientActor,
        message: 'incoming-resources',
        messageValues: [
          ResourceLogic.formatResourceTypesAndNumber(this.props.resources).join(',<br/>'),
        ],
      })
    );
  }
}

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
