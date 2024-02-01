import { CasuMessagePayload } from '../game/common/events/casuMessageEvent';
import {
	isAssignResourcesToTaskActionTemplate,
	isCasuMessageActionTemplate,
	isReleaseResourcesToTaskActionTemplate,
	isSelectMapObjectTemplate,
	isSendResourcesToActorActionTemplate,
	isRadioActionTemplate,
} from '../UIfacade/actionFacade';
import { getAllActors } from '../UIfacade/actorFacade';
import { ResourcesArray, ResourceTypeAndNumber } from "../game/common/resources/resourceType";
import { actionClickHandler, canPlanAction } from "../gameInterface/main";
import { clearMapState, startMapSelect } from '../gameMap/main';
import { ActionTemplateBase } from '../game/common/actions/actionTemplateBase';
import { RadioMessagePayload } from '../game/common/events/radioMessageEvent';
import { getEmptyResourceRequest } from '../gameInterface/interfaceState';
import { ActionType } from '../game/common/actionType';

/**
 * Performs logic whenever a template is initiated in interface
 * 
 * @params ActionTemplateBase action being launched
 */
export function runActionButton(action: ActionTemplateBase | undefined = undefined) {
	if (action != undefined) {
		Context.action = action
	}

	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isSelectMapObjectTemplate(actionRefUid)) {
		// If the action is already planned we cancel it in actionClickHandler and reinitialise the selectionState
		if (!canPlanAction()) {
			startMapSelect();
		} else {
			params = fetchSelectMapObjectValues()!;
			clearMapState();
		}
	} else if (isSendResourcesToActorActionTemplate(actionRefUid)) {

		params = fetchSendResourcesValues();

	} else if (isAssignResourcesToTaskActionTemplate(actionRefUid)) {

		params = fetchAssignResourceValues();

	} else if (isReleaseResourcesToTaskActionTemplate(actionRefUid)) {

		params = fetchReleaseResourceValues();

	} else if (isCasuMessageActionTemplate(actionRefUid)) {

		params = fetchCasuMessageRequestValues();

	} else if (isRadioActionTemplate(actionRefUid)) {

		params = fetchRadioMessageRequestValues(ActionType.ACTORS_RADIO);
	}

	actionClickHandler(Context.action.Uid, Context.action.category, params);
}


/**
 * Generate a SelectMapObjectPayload from interface state
 * 
 * @returns SelectMapObjectPayload
 */
function fetchSelectMapObjectValues() { // TODO Add type

	const mapState = Context.mapState.state;


	let tmpFeature;
	if (mapState.selectionState.geometryType) {
		tmpFeature = {
			geometryType: mapState.selectionState.geometryType,
			feature: mapState.selectionState.geometries[Context.interfaceState.state.selectedMapObjectId]
		}
	}

	if (mapState.selectionState.layerId) {
		tmpFeature = {
			featureKey: mapState.selectionState.featureKey,
			featureId: mapState.selectionState.featureIds[Context.interfaceState.state.selectedMapObjectId]
		}
	}

	return tmpFeature;
}

/**
 * Generate a SendResourcesPayload from interface state
 * 
 * @returns SendResourcesPayload
 */
function fetchSendResourcesValues() { // TODO Add Type
	const sentResources: ResourceTypeAndNumber = {};

	ResourcesArray.forEach(resourceType => {
		const amount = Context.interfaceState.state.resources.sendResources[resourceType];
		if (amount) {
			sentResources[resourceType] = amount;
		}
	});

	const payload = { receiverActor: +Context.interfaceState.state.resources.sendResources.selectedActorId, sentResources };

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
	newState.resources.sendResources.selectedActorId = getAllActors()[0]!.Uid;
	ResourcesArray.forEach(resourceType => {
		newState.resources.sendResources[resourceType] = 0;
	});
	Context.interfaceState.setState(newState);

	return payload;
}

/**
 * Generate a AssignResourcePayload from interface state
 * 
 * @returns AssignResourcePayload
 */
function fetchAssignResourceValues() { // TODO Add Type
	const resourcesForAssignation: ResourceTypeAndNumber = {};

	ResourcesArray.forEach(resourceType => {
		const amount = Context.interfaceState.state.resources.assignResources[resourceType];
		if (amount) {
			resourcesForAssignation[resourceType] = amount;
		}
	});

	const payload = { task: Context.interfaceState.state.resources.assignResources.selectedTaskId, assignedResources: resourcesForAssignation };

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.resources.assignResources.selectedTaskId = '';
	ResourcesArray.forEach(resourceType => {
		newState.resources.assignResources[resourceType] = 0;
	});
	Context.interfaceState.setState(newState);

	return payload;
}

/**
 * Generate a ReleaseResourcePayload from interface state
 * 
 * @returns ReleaseResourcePayload
 */
function fetchReleaseResourceValues() {
	const resourcesForRelease: ResourceTypeAndNumber = {};

	ResourcesArray.forEach(resourceType => {
		const amount = Context.interfaceState.state.resources.releaseResources[resourceType];
		if (amount) {
			resourcesForRelease[resourceType] = amount;
		}
	});

	const payload = { task: Context.interfaceState.state.resources.releaseResources.selectedTaskId, releasedResources: resourcesForRelease };

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.resources.releaseResources.selectedTaskId = '';
	ResourcesArray.forEach(resourceType => {
		newState.resources.releaseResources[resourceType] = 0;
	});
	Context.interfaceState.setState(newState);

	return payload;
}

/**
 * Generate a CasuMessagePayload from interface state
 * 
 * @returns CasuMessagePayload
 */
function fetchCasuMessageRequestValues(): CasuMessagePayload {
	const casuMessage = Context.interfaceState.state.casuMessage;
	const request = Context.interfaceState.state.resources.requestedResources;

	let payload: CasuMessagePayload = { messageType: casuMessage.messageType };

	if (casuMessage.messageType.startsWith('MET')) {
		payload.major = casuMessage.major;
		payload.exact = casuMessage.exact;
		payload.incidentType = casuMessage.incidentType;
	}
	if (casuMessage.messageType.endsWith('HANE')) {
		payload.hazards = casuMessage.hazards;
		payload.access = casuMessage.access;
		payload.victims = casuMessage.victims;
	}
	if (casuMessage.messageType.endsWith('E')) {
		payload.resourceRequest = request;
	}

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.resources.requestedResources = getEmptyResourceRequest();
	newState.casuMessage = {
		messageType: "",
		major: "",
		exact: "",
		incidentType: "",
		hazards: "",
		access: "",
		victims: "",
	};
	Context.interfaceState.setState(newState);

	return payload;
}

/**
 * Generate a RadioMessagePayload from interface state
 * 
 * @returns RadioMessagePayload
 */
function fetchRadioMessageRequestValues(channel: ActionType): RadioMessagePayload {
	let res: RadioMessagePayload;
	if (channel == ActionType.ACTORS_RADIO)
		res = { channel: channel, message: Context.interfaceState.state.channelText.actors, actorId: Context.interfaceState.state.currentActorUid };
	else {
		res = { channel: channel, message: '', actorId: Context.interfaceState.state.currentActorUid };
	}

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state)
	newState.channelText.actors = '';
	Context.interfaceState.setState(newState);

	return res;
}
