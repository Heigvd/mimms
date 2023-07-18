import { BlockName } from "../../../HUMAn/human";
import { AfflictedPathology } from "../../../HUMAn/pathology";
import { MeasureMetric } from "../../../HUMAn/registry/acts";
import { Location } from "../../../map/locationTypes";
import { BaseEvent, TargetedEvent } from "./baseEvent";
import { Channel, Phone, Radio } from "../../legacy/communication";
import { FullEvent } from "./EventManager";
import { ActionSource, ResolvedAction } from "../../legacy/the_world";
import { Categorization } from "../../pretri/triage";
import { SimDuration, SimTime, TranslationKey } from "../baseTypes";

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
	display: {
		pulse_perMin?: number;
	} | undefined;
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
	sender: string;//player id
}

export type DirectCommunicationEvent = CommunicationEvent & {
	type: 'DirectCommunication';
}
///// RADIO EVENTS /////////////////////////
export type RadioChannelUpdateEvent = BaseEvent & {
	type: "RadioChannelUpdate";
	targetRadio: number;
	newChannel: Channel
}

export type RadioCreationEvent = BaseEvent & {
	type: 'RadioCreation';
	radioTemplate : Radio;
	//ownerId: string //the guy who will have it (TODO might be some other entity)
}

export type RadioCommunicationEvent = CommunicationEvent & {
	type: 'RadioCommunication';
	senderRadioId: number ; //radio sending the message
}

//// PHONE EVENTS ////////////////
export type PhoneCommunicationEvent = CommunicationEvent & {
	type: 'PhoneCommunication';
	senderPhoneId: number;
	recipientPhoneId: number;
}

export type PhoneCreationEvent = BaseEvent & {
	type : 'PhoneCreation';
	phoneTemplate : Phone;
}

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
	| GetInformationEvent;

export type EventType = EventPayload['type'];

/////////////////////////////////////////////////
/// NEW EVENTS FOR MAIN SIMULATION
/////////////////////////////////////////////////

export interface ActionEvent extends BaseEvent {
	timeStamp : SimTime;
}

export interface GetInformationEvent extends ActionEvent {
	type: string;
	emitterPlayerId: string;
	emitterCharacterId: string;
	messageKey: TranslationKey;
	actionNameKey: TranslationKey;
	durationSec: SimDuration;
}
