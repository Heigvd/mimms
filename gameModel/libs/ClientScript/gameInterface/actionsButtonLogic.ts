import { CasuMessagePayload } from '../game/common/events/casuMessageEvent';
import {
	getActionTemplate,
	isAssignResourcesToTaskActionTemplate,
	isDefineMapObjectTemplate,
	isCasuMessageActionTemplate,
	isReleaseResourcesToTaskActionTemplate,
	isSelectMapObjectTemplate,
	isSendResourcesToActorActionTemplate,
	planAction,
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


export function runActionButton(action: ActionTemplateBase | undefined = undefined) {
	if (action != undefined) {
		Context.action = action
	}
	
	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isDefineMapObjectTemplate(actionRefUid)) {
		params = Context.action.featureDescription.geometryType;
	} else if (isSelectMapObjectTemplate(actionRefUid)) {

		const ref = getActionTemplate(Context.interfaceState.state.currentActionUid)!.getTemplateRef();
		const actor = Context.interfaceState.state.currentActorUid;
		const mapState = Context.mapState.state;


		// If the action is already planned we cancel it in actionClickHandler and reinitialise the selectionState
		if (!canPlanAction()) {
			startMapSelect();
		} else {
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

			planAction(ref, actor, tmpFeature);
			clearMapState();
			return
		}
	} else if (isSendResourcesToActorActionTemplate(actionRefUid)) {
		const sentResources: ResourceTypeAndNumber = {};

		ResourcesArray.forEach(resourceType => {
			const amount = Context.interfaceState.state.resources.sendResources[resourceType];
			if (amount) {
				sentResources[resourceType] = amount;
			}
		});

		params = { receiverActor: +Context.interfaceState.state.resources.sendResources.selectedActorId, sentResources };

		// once we took the inputs, reset the internal state
		const newState = Helpers.cloneDeep(Context.interfaceState.state);
		newState.resources.sendResources.selectedActorId = getAllActors()[0]!.Uid;
		ResourcesArray.forEach(resourceType => {
			newState.resources.sendResources[resourceType] = 0;
		});
		Context.interfaceState.setState(newState);

	} else if (isAssignResourcesToTaskActionTemplate(actionRefUid)) {
		const resourcesForAssignation: ResourceTypeAndNumber = {};

		ResourcesArray.forEach(resourceType => {
			const amount = Context.interfaceState.state.resources.assignResources[resourceType];
			if (amount) {
				resourcesForAssignation[resourceType] = amount;
			}
		});

		params = { task: Context.interfaceState.state.resources.assignResources.selectedTaskId, assignedResources: resourcesForAssignation };

		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.resources.assignResources.selectedTaskId = '';
		ResourcesArray.forEach(resourceType => {
			newState.resources.assignResources[resourceType] = 0;
		});
		Context.interfaceState.setState(newState);
	} else if (isReleaseResourcesToTaskActionTemplate(actionRefUid)) {
		const resourcesForRelease: ResourceTypeAndNumber = {};

		ResourcesArray.forEach(resourceType => {
			const amount = Context.interfaceState.state.resources.releaseResources[resourceType];
			if (amount) {
				resourcesForRelease[resourceType] = amount;
			}
		});

		params = { task: Context.interfaceState.state.resources.releaseResources.selectedTaskId, releasedResources: resourcesForRelease };

		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.resources.releaseResources.selectedTaskId = '';
		ResourcesArray.forEach(resourceType => {
			newState.resources.releaseResources[resourceType] = 0;
		});
		Context.interfaceState.setState(newState);
	} else if (isCasuMessageActionTemplate(actionRefUid)) {
		params = fetchCasuMessageRequestValues();
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
	} else if (isRadioActionTemplate(actionRefUid)) {
		params = fetchRadioMessageRequestValues(ActionType.ACTORS_RADIO);
		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.channelText.actors = '';
		Context.interfaceState.setState(newState);
	}

	actionClickHandler(Context.action.Uid, Context.action.category, params);
}

export function fetchCasuMessageRequestValues(): CasuMessagePayload {
	const casuMessage = Context.interfaceState.state.casuMessage;
	const request = Context.interfaceState.state.resources.requestedResources;

	let res: CasuMessagePayload = {messageType: casuMessage.messageType};

	if (casuMessage.messageType.startsWith('MET')) {
		res.major = casuMessage.major;
		res.exact = casuMessage.exact;
		res.incidentType = casuMessage.incidentType;
	} 
	if (casuMessage.messageType.endsWith('HANE')) {
		res.hazards = casuMessage.hazards;
		res.access = casuMessage.access;
		res.victims = casuMessage.victims;
	}
	if (casuMessage.messageType.endsWith('E')) {
		res.resourceRequest = request;
	}

	return res;
}

export function fetchRadioMessageRequestValues(channel: ActionType): RadioMessagePayload {
	let res: RadioMessagePayload;
	if (channel == ActionType.ACTORS_RADIO)
		res = {channel: channel, message: Context.interfaceState.state.channelText.actors, actorId: Context.interfaceState.state.currentActorUid};
	else {
		res = {channel: channel, message: '', actorId: Context.interfaceState.state.currentActorUid};
	}
	return res;
}
