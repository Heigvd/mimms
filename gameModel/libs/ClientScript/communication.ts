import { BaseEvent, initEmitterIds} from "./baseEvent";
import { FullEvent, sendEvent } from "./EventManager";
import { EventPayload } from "./the_world";
import { getCurrentSimulationTime } from "./TimeManager";
import { whoAmI } from "./WegasHelper";

export type Channel = string;

export type Radio = {
	id: number | undefined;
	name: string;
	availableChannels: Channel[];
	channel: Channel;
}

export type Phone = {
	phoneName : string;
	phoneId : number;
	//other phone ids present in contact
	//contactIds : number[];
}

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

const commLogger = Helpers.getLogger("communication");
// Messages time to live before being discarded
const messageTTLsec = 20;

const noMessages = 'no messages';

//// DIRECT COMMM

let directMessages : Record<string, FullEvent<DirectCommunicationEvent>[]> = {};

export function processDirectMessageEvent(event: FullEvent<DirectCommunicationEvent>, senderId: string){
	if(!directMessages[senderId]){
		directMessages[senderId] = [];
	}
	//TODO time filtering could occur here
	directMessages[senderId]!.push(event);
}

//// RADIO /////

//radios by id
let radios : Record<string, Radio> = {};
// indexed by channel
let radioMessages : Record<string, FullEvent<RadioCommunicationEvent>[]>= {};

export type RadioSelectionState = {
	selectedRadioId: number
}


export function getInitialRadioState(): RadioSelectionState {
	const radios = getRadios();
	if(radios && radios.length > 0){
		return {selectedRadioId : radios[0]!.id!}
	}else{
		return {selectedRadioId : -1};
	}
}

export function getRadio(id: number): Radio | undefined {
	return radios[id];
}

export function getRadios(): Radio[] {
	return Object.values(radios);
}

export function getChannelChoices(radioId: number): {label: string, value: string}[]{
	const r = getRadio(radioId);
	if(r){
		return r.availableChannels.map(v => {return {label:v, value:v}});
	}
	return [{label: 'None', value: "-1"}];
}

export function processRadioChannelUpdate(event : FullEvent<RadioChannelUpdateEvent>){

	const radio = radios[event.payload.targetRadio]
	if(radio){
		if(radio.availableChannels.find((s) => event.payload.newChannel === s)){
			radio.channel = event.payload.newChannel;
		}else{
			commLogger.warn('Channel not available');
		}
	}else{
		commLogger.warn('Radio does not exist');
	}
}

export function processRadioCreationEvent(event : FullEvent<RadioCreationEvent>): void{

	if(event.payload.radioTemplate){
		if(Object.values(radios).find(r => r.name === event.payload.radioTemplate.name)){
			return; //ignore multiple radios with same name
		}
		event.payload.radioTemplate.id = event.id;//take event uid as radio uid
		radios[event.id] = event.payload.radioTemplate;
	}else{
		commLogger.error('Could not create radio : missing radioTemplate object');
	}

}

export function processRadioCommunication(event : FullEvent<RadioCommunicationEvent>): void {
	//TODO filter out old messages
	const radio = getRadio(event.payload.senderRadioId);
	if(!radio)
	{
		commLogger.error('Cannot handle message, radio with id ' + event.payload.senderRadioId + ' it does not exist');
	}else {
		const channel = radio.channel;

		if(!radioMessages[channel]){
			radioMessages[channel] = [];
		}
		radioMessages[channel]!.push(event);
	}

}

//// PHONE //////

// phones by id
let phones : Record<number, Phone> = {};
//by recipient id
let phoneMessages : Record<number, FullEvent<PhoneCommunicationEvent>[]> = {};

export function processPhoneCommunication(event : FullEvent<PhoneCommunicationEvent>){
	const rcpId = event.payload.recipientPhoneId;
	//commLogger.warn('processing phone comm event', event);
	if(event.payload.recipientPhoneId && phones[rcpId]){
		//if(!phoneMessages[rcpId]){
		//	phoneMessages[rcpId] = [];
		//}
		phoneMessages[rcpId]!.push(event);
	}else{
		commLogger.warn(`Ignoring event ${event}, recipient phone does not exist`);
	}
}

export function processPhoneCreation(event : FullEvent<PhoneCreationEvent>){
	const id = event.id;
	if(!phones[id]){
		phones[id] = event.payload.phoneTemplate;
		phones[id]!.phoneId = id;//assign event id as phone id
		//phones[id].contactIds = phones[id].contactIds || [];
		phoneMessages[id] = [];
	}else{
		commLogger.warn(`Ignoring phone creation of ${event.payload.phoneTemplate}, already exists`);
	}

}

export function getPhones(filterFunc? : ((p :Phone) => boolean)): Phone[] {
	if(filterFunc){
		return Object.values(phones).filter(p => filterFunc(p));
	}else{
		return Object.values(phones)
	}
}

export function getOtherPhones(): Phone[] {
	const mine = getMyPhone();
	return getPhones((p) => p.phoneId !== mine?.phoneId);
}

export function getPhoneDropDownList(): {label: string, value: string}[] {
	const phones = getOtherPhones();
	return phones.map(p => ({label : p.phoneName, value: p.phoneId.toString()}));
}

export function getUserPhone(name: string): Phone | undefined {
	const phones = getPhones(p => p.phoneName?.startsWith(name));
	return phones.length > 0 ? phones[0]: undefined;
}

export function userHasPhone(name?: string): boolean {
	return getUserPhone(name || whoAmI()) !== undefined;
}

export function getMyPhone(): Phone | undefined {
	return getUserPhone(whoAmI());
}

////// GET MESSAGES ///////
export function getRadioMessages(channel: Channel): string[] {

	const filteredByChannel = radioMessages[channel];
	const filtered = filterByTime(filteredByChannel!);
	return filtered.map(m => `(${m.time}) radio ${m.payload.senderRadioId} : ${m.payload.message}`);
}

// get messages sent to a phone from another phone to current patient
export function getPhoneMessages(fromPhoneId : number): string[] {

	const myPhone = getMyPhone();

	if(myPhone){
		//commLogger.warn(myPhone);
		if(phoneMessages[myPhone.phoneId])
		{
			const messages = phoneMessages[myPhone.phoneId]!;
			//commLogger.warn(messages);
			const filtered = messages.filter(m => m.payload.senderPhoneId === fromPhoneId);
			return filtered.map(m => {return `${m.time} : ${m.payload.message}`;});
		}else {
			return [noMessages];
		}

	}else{
		return [whoAmI() + ' has no phone'];
	}
}

/**
 * @return the recent messages from a given player
 */
export function getDirectMessagesFrom(senderId: string): string[] {
	if(directMessages[senderId]){
		const filtered = filterByTime(directMessages[senderId]!);
		return filtered.map(m => `(${m.time}) ${m.payload.message}`);
	}
	return [];
}

function filterByTime<E extends FullEvent<EventPayload>>(events: E[]): E[]{
	if(!events || events.length == 0)
	{
		return [];
	} 
	const currentTime = getCurrentSimulationTime();
	return events.filter( e => e.time <= currentTime && (e.time > currentTime - messageTTLsec)
	);
}

/**
 * Clears all the local communication state
 */
export function clearAllCommunicationState(){
	directMessages = {};
	radios = {};
	radioMessages = {};
	phoneMessages = {};
	phones = {};
}

//////// EVENTS EMISSION ///////

function emitEvent(payload : any){
	sendEvent({
		...initEmitterIds(),
		...payload,
	});
}

export function emitRadioCreation(name: string, channels : string[], selected: string){
	emitEvent({
		type: 'RadioCreation',
		radioTemplate: {
			availableChannels : channels,
			channel : selected,
			name: name,
			id: undefined
		}
	})
}

export function emitRadioChannelUpdateEvent(radioId: number, newChannel: string){
	emitEvent({
		type: 'RadioChannelUpdate',
		targetRadio: radioId,
		newChannel: newChannel
	})
}

export function emitRadioCommunication(msg: string, radioId: number){
	emitEvent({
		type: 'RadioCommunication',
		message: msg,
		senderRadioId : radioId,

	})
}

export function emitPhoneCreationEvent(player: string){
	emitEvent({
		type: 'PhoneCreation',
		phoneTemplate :{
			phoneName : player + "'s phone",
			phoneId : -1, // filled later on
		}
	})
}

export function emitPhoneMessageEvent(senderPhoneId : number, recipientPhoneId: number, message: string){
	emitEvent({
		type: 'PhoneCommunication',
		senderPhoneId: senderPhoneId,
		recipientPhoneId: recipientPhoneId,
		message : message
	})
}
