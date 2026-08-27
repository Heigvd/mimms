import { BlockName } from '../../../HUMAn/human';
import { AfflictedPathology } from '../../../HUMAn/pathology';
import { MeasureMetric } from '../../../HUMAn/registry/acts';
import { ActionSource } from '../../pretri/patientProcessing';
import { Categorization } from '../../pretri/triage';
import { ChoiceDescriptor } from '../actions/choiceDescriptor/choiceDescriptor';
import { InterventionRole } from '../actors/actor';
import { ActionTemplateUid, ActorId, SimDuration, SimTime, TaskId } from '../baseTypes';
import { GameOptions } from '../gameOptions';
import { RadioType } from '../radio/communicationType';
import { CommMedia } from '../resources/resourceReachLogic';
import { ResourceTypeAndNumber } from '../resources/resourceType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { BaseEvent, TargetedEvent } from './baseEvent';
import { FullEvent } from './eventUtils';
import { SourceType } from '../localEvents/localEventBase';

export interface PathologyEvent extends TargetedEvent, AfflictedPathology {
  type: 'HumanPathology';
}

export interface HumanLogMessageEvent extends TargetedEvent {
  type: 'HumanLogMessage';
  message: string;
}

export interface HumanMeasureEvent extends TargetedEvent {
  type: 'HumanMeasure';
  source: ActionSource;
}

export type MeasureResultStatus = 'success' | 'failed_missing_skill' | 'cancelled' | 'unknown';

export interface HumanMeasureResultEvent extends TargetedEvent {
  type: 'HumanMeasureResult';
  sourceEventId: number;
  status: MeasureResultStatus;
  result?: MeasureMetric[];
  duration: number;
}

export interface HumanTreatmentEvent extends TargetedEvent {
  type: 'HumanTreatment';
  source: ActionSource;
  blocks: BlockName[];
}

export interface CategorizeEvent extends TargetedEvent, Categorization {
  type: 'Categorize';
}

export interface FreezeEvent extends TargetedEvent {
  type: 'Freeze';
  mode: 'freeze' | 'unfreeze';
}

export interface ScriptedEvent {
  time: number;
  payload: PathologyEvent | HumanTreatmentEvent;
}

export interface AgingEvent extends TargetedEvent {
  type: 'Aging';
  deltaSeconds: number;
}

export type EventPayload =
  | PathologyEvent
  | HumanTreatmentEvent
  | HumanMeasureEvent
  | HumanMeasureResultEvent
  | HumanLogMessageEvent
  | CategorizeEvent
  | FreezeEvent
  | AgingEvent
  // NEW EVENTS
  | TimeForwardEvent
  | ActionCreationEvent
  // TRAINER EVENT
  | DashboardRadioMessageEvent
  | DashboardNotificationMessageEvent
  | GameOptionsEvent;

export type EventType = EventPayload['type'];

/////////////////////////////////////////////////
/// NEW EVENTS FOR MAIN SIMULATION
/////////////////////////////////////////////////
interface TimedPayload {
  /**
   * Simulation time at which the event has to take effect
   */
  triggerTime: SimTime;
  /**
   * Ignore trigger time when processing this event
   */
  dashboardForced?: boolean;
}

export type TimedEventPayload = TimedPayload & EventPayload;

export interface DashboardRadioMessageEvent extends BaseEvent, TimedPayload {
  type: 'DashboardRadioMessageEvent';
  canal: RadioType;
  message: string;
}

export interface DashboardNotificationMessageEvent extends BaseEvent, TimedPayload {
  type: 'DashboardNotificationMessageEvent';
  roles: InterventionRole[];
  message: string;
}

export interface ActionCreationEvent extends BaseEvent, TimedPayload {
  type: 'ActionCreationEvent';
  templateUid: ActionTemplateUid;
}

export interface GameOptionsEvent extends BaseEvent, TimedPayload {
  type: 'GameOptionsEvent';
  source: SourceType['type'] & ('trainer' | 'initialisation');
  options: GameOptions;
}

export interface StandardActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
}

export interface ChoiceEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  choice: ChoiceDescriptor;
}

export interface MoveResourcesAssignTaskEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  commMedia: CommMedia;
  sourceLocation: LOCATION_ENUM;
  targetLocation: LOCATION_ENUM;
  sentResources: ResourceTypeAndNumber;
  sourceTaskId: TaskId;
  targetTaskId: TaskId;
}

export interface RequestPretriageReportEvent extends ActionCreationEvent {
  durationSec: SimDuration;
}

interface TimeForwardEventBase extends BaseEvent, TimedPayload {
  /**
   * Actors played by the emitter of the event
   */
  involvedActors: ActorId[];
}

/**
 * Emitted when a player is ready to forward time
 */
export interface TimeForwardEvent extends TimeForwardEventBase {
  type: 'TimeForwardEvent';
  /**
   * The time duration to jump forward
   */
  timeJump: SimDuration;
}

export function isLegacyGlobalEvent(event: FullEvent<EventPayload>) {
  switch (event.payload.type) {
    case 'HumanPathology':
    case 'HumanTreatment':
    case 'HumanMeasure':
    case 'Categorize':
    case 'HumanLogMessage':
    case 'Freeze':
    case 'Aging':
    case 'HumanMeasureResult':
      return true;
  }
  return false;
}

export interface MoveActorEvent extends ActionCreationEvent {
  location: LOCATION_ENUM;
}

export interface AppointActorEvent extends ActionCreationEvent {
  actorRole: InterventionRole;
}
