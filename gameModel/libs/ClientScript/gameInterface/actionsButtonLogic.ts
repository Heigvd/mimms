import {
CasuMessagePayload,
	HospitalRequestPayload,
	MethaneMessagePayload,
} from '../game/common/events/casuMessageEvent';
import {
	isCasuMessageActionTemplate,
	isFixedMapEntityTemplate,
	isRadioActionTemplate,
	isMoveActorActionTemplate,
	isMoveResourcesAssignTaskActionTemplate,
} from '../UIfacade/actionFacade';
import { ResourcesArray, ResourceTypeAndNumber } from '../game/common/resources/resourceType';
import { actionClickHandler, canPlanAction } from './main';
import { clearMapState, startMapSelect } from '../gameMap/main';
import { ActionTemplateBase } from '../game/common/actions/actionTemplateBase';
import { RadioMessagePayload } from '../game/common/events/radioMessageEvent';
import { getEmptyResourceRequest } from './interfaceState';
import { ActionType } from '../game/common/actionType';
import { BuildingStatus, FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';

/**
 * Performs logic whenever a template is initiated in interface
 *
 * @params ActionTemplateBase action being launched
 */
export function runActionButton(action: ActionTemplateBase | undefined = undefined) {
	if (action != undefined) {
		Context.action = action;
	}

	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isFixedMapEntityTemplate(actionRefUid)) {
		// If the action is already planned we cancel it in actionClickHandler and reinitialise the selectionState
		if (!canPlanAction()) {
			startMapSelect();
		} else {
			params = fetchSelectMapObjectValues()!;
			clearMapState();
		}
	} else if (isMoveResourcesAssignTaskActionTemplate(actionRefUid)) {
		params = fetchMoveResourcesAssignTaskValues();
	} else if (isCasuMessageActionTemplate(actionRefUid)) {
		params = fetchCasuMessageRequestValues();
	} else if (isRadioActionTemplate(actionRefUid)) {
		params = fetchRadioMessageRequestValues(ActionType.ACTORS_RADIO);
	} else if (isMoveActorActionTemplate(actionRefUid)) {
		params = fetchMoveActorLocation();
	}

	actionClickHandler(Context.action.Uid, Context.action.category, params);
}

/**
 * Generate a SelectMapObjectPayload from interface state
 *
 * @returns SelectMapObjectPayload
 */
function fetchSelectMapObjectValues() {
	// TODO Add type

	const mapState = Context.mapState.state;
	let tmpFixedEntity;
	if (mapState.selectionState instanceof FixedMapEntity) {
		tmpFixedEntity = mapState.selectionState as FixedMapEntity;
		tmpFixedEntity.buildingStatus = BuildingStatus.inProgress;
		tmpFixedEntity.getGeometricalShape().selectedPosition =
			mapState.selectionState.getGeometricalShape().availablePositions[
				Context.interfaceState.state.selectedMapObjectId
			];
	}

	return tmpFixedEntity;
}

/**
 * Generate a MoveResourcesAssignTaskPayload from interface state
 *
 * @returns MoveResourcesAssignTaskPayload
 */
function fetchMoveResourcesAssignTaskValues() {
	// TODO Add Type
	const sentResources: ResourceTypeAndNumber = {};

	ResourcesArray.forEach(resourceType => {
		const amount = Context.interfaceState.state.resources.allocateResources[resourceType];
		if (amount) {
			sentResources[resourceType] = amount;
		}
	});

	const payload = {
		sourceLocation: Context.interfaceState.state.resources.allocateResources.currentLocation,
		targetLocation: Context.interfaceState.state.resources.allocateResources.targetLocation,
		sentResources: sentResources,
		sourceTaskId: Context.interfaceState.state.resources.allocateResources.currentTaskId,
		targetTaskId: Context.interfaceState.state.resources.allocateResources.targetTaskId,
	};

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
	newState.resources.allocateResources.currentLocation = undefined;
	newState.resources.allocateResources.currentTaskId = undefined;
	newState.resources.allocateResources.targetLocation = undefined;
	newState.resources.allocateResources.targetTaskId = undefined;
	ResourcesArray.forEach(resourceType => {
		newState.resources.allocateResources[resourceType] = 0;
	});
	Context.interfaceState.setState(newState);
	return payload;
}

/**
 * Generate a SendResourcesToLocationPayload from interface state
 *
 * @returns SendResourcesToLocationPayload
 */
function fetchSendResourcesToLocationValues() {
	// TODO Add Type
	const sentResources: ResourceTypeAndNumber = {};

	ResourcesArray.forEach(resourceType => {
		const amount = Context.interfaceState.state.resources.sendResources[resourceType];
		if (amount) {
			sentResources[resourceType] = amount;
		}
	});

	const payload = {
		sourceLocation: Context.interfaceState.state.resources.sendResources.sourceLocation,
		destinationLocation: Context.interfaceState.state.resources.sendResources.destinationLocation,
		sentResources,
	};

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
	newState.resources.sendResources.sourceLocation = LOCATION_ENUM.meetingPoint;
	newState.resources.sendResources.destinationLocation = LOCATION_ENUM.meetingPoint;
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
function fetchAssignResourceValues() {
	// TODO Add Type
	const resourcesForAssignation: ResourceTypeAndNumber = {};

	ResourcesArray.forEach(resourceType => {
		const amount = Context.interfaceState.state.resources.assignResources[resourceType];
		if (amount) {
			resourcesForAssignation[resourceType] = amount;
		}
	});

	const payload = {
		task: Context.interfaceState.state.resources.assignResources.selectedTaskId,
		assignedResources: resourcesForAssignation,
	};

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
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

	const payload = {
		task: Context.interfaceState.state.resources.releaseResources.selectedTaskId,
		releasedResources: resourcesForRelease,
	};

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
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
	const hospitalProximity = Context.interfaceState.state.getHospitalInfoChosenProximity;

	// For now only case where CasuMessage isn't METHANE related
	if (casuMessage.messageType === 'R') {
		const payload: HospitalRequestPayload = {
			messageType: casuMessage.messageType,
			proximity: hospitalProximity,
		};
    
    const newState = Helpers.cloneDeep(Context.interfaceState.state);
    newState.getHospitalInfoChosenProximity = undefined;
    Context.interfaceState.setState(newState);

		return payload;
	} else {
		const payload: MethaneMessagePayload = { messageType: casuMessage.messageType };

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
		const newState = Helpers.cloneDeep(Context.interfaceState.state);
		newState.resources.requestedResources = getEmptyResourceRequest();
		newState.casuMessage = {
			messageType: '',
			major: '',
			exact: '',
			incidentType: '',
			hazards: '',
			access: '',
			victims: '',
		};
		Context.interfaceState.setState(newState);

		return payload;
	}
}

/**
 * Generate a RadioMessagePayload from interface state
 *
 * @returns RadioMessagePayload
 */
function fetchRadioMessageRequestValues(channel: ActionType): RadioMessagePayload {
	let res: RadioMessagePayload;
	if (channel == ActionType.ACTORS_RADIO)
		res = {
			channel: channel,
			message: Context.interfaceState.state.channelText.actors,
			actorId: Context.interfaceState.state.currentActorUid,
		};
	else {
		res = { channel: channel, message: '', actorId: Context.interfaceState.state.currentActorUid };
	}

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
	newState.channelText.actors = '';
	Context.interfaceState.setState(newState);

	return res;
}

/**
 * Get chosen location for moveActorAction
 * @returns LOCATION_ENUM
 */
function fetchMoveActorLocation() {
	const res = Context.interfaceState.state.moveActorChosenLocation;

	// Reset interfaceState
	const newState = Helpers.cloneDeep(Context.interfaceState.state);
	newState.moveActorChosenLocation = undefined;
	Context.interfaceState.setState(newState);

	return res;
}
