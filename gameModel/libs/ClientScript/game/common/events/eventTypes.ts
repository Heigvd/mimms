import { BlockName } from '../../../HUMAn/human';
import { AfflictedPathology } from '../../../HUMAn/pathology';
import { MeasureMetric } from '../../../HUMAn/registry/acts';
import { Location } from '../../../map/locationTypes';
import { BaseEvent, TargetedEvent } from './baseEvent';
import { Channel, Phone, Radio } from '../../legacy/communication';
import { FullEvent } from './eventUtils';
import { ActionSource, ResolvedAction } from '../../legacy/the_world';
import { Categorization } from '../../pretri/triage';
import {
  ActorId,
  SimDuration,
  SimTime,
  TaskId,
  TemplateId,
  TemplateRef,
  TranslationKey,
} from '../baseTypes';
import { ResourceTypeAndNumber } from '../resources/resourceType';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { InterventionRole } from '../actors/actor';

/**
 * Walk, drive, fly to destination
 */
export interface FollowPathEvent extends TargetedEvent {
  type: 'FollowPath';
  from: Location;
  destination: Location;
}

/** Aka teleportation */
export interface TeleportEvent extends TargetedEvent {
  type: 'Teleport';
  location: Location;
}

export interface PathologyEvent extends TargetedEvent, AfflictedPathology {
  type: 'HumanPathology';
}

export interface HumanLogMessageEvent extends TargetedEvent {
  type: 'HumanLogMessage';
  message: string;
}

export interface DelayedAction {
  id: number;
  dueDate: number;
  action: ResolvedAction;
  event: FullEvent<HumanTreatmentEvent | HumanMeasureEvent>;
  resultEvent: HumanMeasureResultEvent | undefined;
  display:
    | {
        pulse_perMin?: number;
      }
    | undefined;
}

export interface HumanMeasureEvent extends TargetedEvent {
  type: 'HumanMeasure';
  timeJump: boolean;
  source: ActionSource;
}

export type MeasureResultStatus =
  | 'success'
  | 'failed_missing_object'
  | 'failed_missing_skill'
  | 'cancelled'
  | 'unknown';

export interface HumanMeasureResultEvent extends TargetedEvent {
  type: 'HumanMeasureResult';
  sourceEventId: number;
  status: MeasureResultStatus;
  result?: MeasureMetric[];
  duration: number;
}

export interface HumanTreatmentEvent extends TargetedEvent {
  type: 'HumanTreatment';
  timeJump: boolean;
  source: ActionSource;
  blocks: BlockName[];
}

export interface CancelActionEvent {
  type: 'CancelAction';
  eventId: number;
}

export interface CategorizeEvent extends TargetedEvent, Categorization {
  type: 'Categorize';
}

export interface GiveBagEvent extends TargetedEvent {
  type: 'GiveBag';
  bagId: string;
}

export interface FreezeEvent extends TargetedEvent {
  type: 'Freeze';
  mode: 'freeze' | 'unfreeze';
}

export interface ScriptedEvent {
  time: number;
  payload: PathologyEvent | HumanTreatmentEvent | TeleportEvent;
}

export interface AgingEvent extends TargetedEvent {
  type: 'Aging';
  deltaSeconds: number;
}

// Communication events
export type CommunicationEvent = BaseEvent & {
  message: string;
  sender: string; //player id
};

export type DirectCommunicationEvent = CommunicationEvent & {
  type: 'DirectCommunication';
};
///// RADIO EVENTS /////////////////////////
export type RadioChannelUpdateEvent = BaseEvent & {
  type: 'RadioChannelUpdate';
  targetRadio: number;
  newChannel: Channel;
};

export type RadioCreationEvent = BaseEvent & {
  type: 'RadioCreation';
  radioTemplate: Radio;
  //ownerId: string //the guy who will have it (TODO might be some other entity)
};

export type RadioCommunicationEvent = CommunicationEvent & {
  type: 'RadioCommunication';
  senderRadioId: number; //radio sending the message
};

//// PHONE EVENTS ////////////////
export type PhoneCommunicationEvent = CommunicationEvent & {
  type: 'PhoneCommunication';
  senderPhoneId: number;
  recipientPhoneId: number;
};

export type PhoneCreationEvent = BaseEvent & {
  type: 'PhoneCreation';
  phoneTemplate: Phone;
};

export type EventPayload =
  | FollowPathEvent
  | TeleportEvent
  | PathologyEvent
  | HumanTreatmentEvent
  | HumanMeasureEvent
  | HumanMeasureResultEvent
  | HumanLogMessageEvent
  | CategorizeEvent
  | DirectCommunicationEvent
  | RadioCommunicationEvent
  | RadioChannelUpdateEvent
  | RadioCreationEvent
  | PhoneCommunicationEvent
  | PhoneCreationEvent
  | GiveBagEvent
  | CancelActionEvent
  | FreezeEvent
  | AgingEvent
  // NEW EVENTS
  | TimeForwardEvent
  | TimeForwardCancelEvent
  | ActionCreationEvent
  | ActionCancellationEvent;

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
  bypassTriggerTime?: boolean;
}

export type TimedEventPayload = TimedPayload & EventPayload;

export interface ActionCreationEvent extends BaseEvent, TimedPayload {
  type: 'ActionCreationEvent';
  templateRef: TemplateRef;
}

export interface ActionCancellationEvent extends BaseEvent, TimedPayload {
  type: 'ActionCancellationEvent';
  templateId: TemplateId;
  actorId: ActorId;
  timeStamp: SimTime;
}

export interface StandardActionEvent extends ActionCreationEvent {
  durationSec: SimDuration;
}

export interface MoveResourcesAssignTaskEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  failMessage: TranslationKey;
  sourceLocation: LOCATION_ENUM;
  targetLocation: LOCATION_ENUM;
  sentResources: ResourceTypeAndNumber;
  sourceTaskId: TaskId;
  targetTaskId: TaskId;
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

  /**
   * set to true when triggered by trainer. involvedActors are ignored
   */
  forced: boolean;
}

/**
 * Emitted When a player cancels his request to forward time
 */
export interface TimeForwardCancelEvent extends TimeForwardEventBase {
  type: 'TimeForwardCancelEvent';
}

export function isLegacyGlobalEvent(event: FullEvent<EventPayload>) {
  switch (event.payload.type) {
    case 'Teleport':
    case 'FollowPath':
    case 'HumanPathology':
    case 'HumanTreatment':
    case 'HumanMeasure':
    case 'Categorize':
    case 'HumanLogMessage':
    case 'DirectCommunication':
    case 'RadioCommunication':
    case 'RadioChannelUpdate':
    case 'RadioCreation':
    case 'PhoneCommunication':
    case 'PhoneCreation':
    case 'GiveBag':
    case 'CancelAction':
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
