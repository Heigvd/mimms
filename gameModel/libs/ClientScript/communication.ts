
import { BaseEvent} from "./baseEvent";
import { getCurrentSimulationTime } from "./TimeManager";
import { whoAmI } from "./WegasHelper";

export type Channel = string;

export type Radio = {
	id: number;
	name: string;
	availableChannels: Channel[];
	channel: Channel;
}

export type Phone = {
	phoneName : string;
	phoneId : number;
	//other phone ids present in contact
	contactIds : number[];
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

export type PhoneContactExchangeEvent = BaseEvent & {
	type : 'PhoneContactExchange';
	phoneId1 : number;
	phoneId2: number;
}

const commLogger = Helpers.getLogger("communication");
// Messages time to live before being discarded
const messageTTLsec = 20;

const noMessages = 'no messages';

//// DIRECT COMMM

const directMessages : Record<string, DirectCommunicationEvent[]> = {};

export function processDirectMessageEvent(event: DirectCommunicationEvent, selectedPatient: string){
	//commLogger.warn(`processing direct com event (${event.id}) : ${event.message}`);
	if(!directMessages[selectedPatient]){
		directMessages[selectedPatient] = [];
	}
	//TODO time filtering could occur here
	directMessages[selectedPatient].push(event);
}

//// RADIO /////

//radios by id
const radios : Record<string, Radio> = {};
// indexed by channel
const radioMessages : Record<string, RadioCommunicationEvent[]>= {};

export type RadioSelectionState = {
	selectedRadioId: number
}

/*export type PhoneSelectionState = {
	selectedPhoneId : number
}*/

export function getInitialRadioState(): RadioSelectionState {
	const radios = getRadios();
	if(radios && radios.length > 0){
		return {selectedRadioId : radios[0].id}
	}else{
		return {selectedRadioId : -1};
	}
}

export function getRadio(id: number): Radio {
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

export function processRadioChannelUpdate(event : RadioChannelUpdateEvent){

	commLogger.warn(`processing radio channel change event (${event.id}) : ${event.newChannel}`);

	commLogger.warn(radios);
	commLogger.warn(event.targetRadio);

	const radio = radios[event.targetRadio]
	if(radio){
		if(radio.availableChannels.find((s) => event.newChannel === s)){
			radio.channel = event.newChannel;
		}else{
			commLogger.warn('Channel not available');
		}
	}else{
		commLogger.warn('Radio does not exist');
	}
}

export function processRadioCreationEvent(event : RadioCreationEvent): void{
	commLogger.warn(`processing radio creation event (${event.id}) : ${event}`);

	if(event.radioTemplate){
		if(Object.values(radios).find(r => r.name === event.radioTemplate.name)){
			return; //ignore multiple radios with same name
		}
		event.radioTemplate.id = event.id;//take event uid as radio uid
		radios[event.id] = event.radioTemplate;
	}else{
		commLogger.error('Could not create radio : missing radioTemplate object');
	}

}

export function processRadioCommunication(event : RadioCommunicationEvent): void {
	//TODO filter out old messages
	const radio = getRadio(event.senderRadioId);
	if(!radio)
	{
		commLogger.error('Cannot handle message, radio with id ' + event.senderRadioId + ' it does not exist');
	}else {
		const channel = radio.channel;
		
		if(!radioMessages[channel]){
			radioMessages[channel] = [];
		}
		radioMessages[channel].push(event);
	}

}

//// PHONE //////

// phones by id
const phones : Record<number, Phone> = {};
//by recipient id
const phoneMessages : Record<number, PhoneCommunicationEvent[]> = {};

export function processPhoneCommunication(event : PhoneCommunicationEvent){
	const rcpId = event.recipientPhoneId;
	commLogger.warn(rcpId);
	commLogger.warn(phones);
	commLogger.warn(phoneMessages);
	if(event.recipientPhoneId && phones[rcpId]){
		//if(!phoneMessages[rcpId]){
		//	phoneMessages[rcpId] = [];
		//}
		phoneMessages[rcpId].push(event);
	}else{
		commLogger.warn(`Ignoring event ${event}, recipient phone does not exist`);
	}
}

export function processPhoneContactExchange(event : PhoneContactExchangeEvent){
	const id1 = event.phoneId1;
	const id2 = event.phoneId2;
	if(phones[id1]){
		phones[id1].contactIds.push(id2);
	}
	if(phones[id2]){
		phones[id2].contactIds.push(id1);
	}
}

export function processPhoneCreation(event : PhoneCreationEvent){
	commLogger.warn(`processing phone creation event (${event.id}) : ${event.phoneTemplate}`);
	const id = event.id;
	if(!phones[id]){
		phones[id] = event.phoneTemplate;
		phones[id].phoneId = id;//assign event id as phone id
		phones[id].contactIds = phones[id].contactIds || [];
		phoneMessages[id] = [];
	}else{
		commLogger.warn(`Ignoring phone creation of ${event.phoneTemplate}, already exists`);
	}

}

export function getPhones(): Phone[] {
	//commLogger.warn(phones);
	return Object.values(phones);
}

export function getPhoneDropDownList(): {label: string, value: string}[] {
	const phones = getPhones();
	return phones.map(p => ({label : p.phoneName, value: p.phoneId.toString()}));
}

export function getUserPhone(name: string): Phone | undefined {
	const phones = getPhones();
	return phones.find(p => p.phoneName?.startsWith(name));
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
	const filtered = filterByTime(filteredByChannel);
	return filtered.map(m => `(${m.time}) radio ${m.senderRadioId} : ${m.message}`);
}

// get messages sent to a phone from another phone to current patient
export function getPhoneMessages(fromPhoneId : number): string[] {

	const recipient = Variable.find(gameModel, 'currentPatient').getValue(self);
	const rPhone = getUserPhone(recipient);

	//const fromPhone = phones[fromPhoneId];
	//const fromName = fromPhone?.phoneName || fromPhoneId;

	if(rPhone){
		commLogger.warn(rPhone);
		if(phoneMessages[rPhone.phoneId])
		{
			const messages = phoneMessages[rPhone.phoneId];
			commLogger.warn(messages);
			const filtered = messages.filter(m => m.senderPhoneId === fromPhoneId);
			return filtered.map(m => {return `${m.time} : ${m.message}`;});
		}else {
			return [noMessages];
		}

	}else{
		return [recipient + ' has no phone'];
	}
}

/**
 * @return the messages heard recently by the current patient 
 */
export function getDirectMessages(): string[] {
	//Note : should be whoAmI. current patient here for test purposes
	const selected = Variable.find(gameModel, 'currentPatient').getValue(self);
	if(directMessages[selected]){
		const filtered = filterByTime(directMessages[selected]);
		return filtered.map(m => `(${m.time}) ${m.sender} : ${m.message}`);
	}
	return [];
}

function filterByTime<E extends BaseEvent>(events: E[]): E[]{
	const currentTime = getCurrentSimulationTime();
	return events.filter( e => e.time > currentTime - messageTTLsec);
} 


