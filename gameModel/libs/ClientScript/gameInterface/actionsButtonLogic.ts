import { MethanePayload } from '../game/common/events/methaneEvent';
import {
	getActionTemplate,
	isAssignResourcesToTaskActionTemplate,
	isDefineMapObjectTemplate,
	isMethaneActionTemplate,
	isReleaseResourcesToTaskActionTemplate,
	isSelectMapObjectTemplate,
	isSendResourcesToActorActionTemplate,
	planAction,
} from '../UIfacade/actionFacade';
import { getAllActors } from '../UIfacade/actorFacade';
import { ResourcesArray, ResourceTypeAndNumber } from "../game/common/resources/resourceType";
import { actionClickHandler, canPlanAction } from "../gameInterface/main";
import { clearMapState, startMapSelect } from '../gameMap/main';


export function runActionButton() {
	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isDefineMapObjectTemplate(actionRefUid)) {
		params = Context.action.featureDescription.geometryType;
	} else if (isSelectMapObjectTemplate(actionRefUid)) {

		const ref = getActionTemplate(Context.interfaceState.state.currentActionUid)!.getTemplateRef();
		const actor = Context.interfaceState.state.currentActorUid;
		const mapState = Context.mapState.state;

	// Does this belong here ?

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
		const sentResources : ResourceTypeAndNumber = {};

		ResourcesArray.forEach(resourceType => {
			const amount = Context.interfaceState.state.resources.sendResources[resourceType];
			if(amount){
				sentResources[resourceType]= amount;
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
		const resourcesForAssignation : ResourceTypeAndNumber = {};

		ResourcesArray.forEach(resourceType => {
			const amount = Context.interfaceState.state.resources.assignResources[resourceType];
			if(amount){
				resourcesForAssignation[resourceType]= amount;
			}
		});

		params = {task: Context.interfaceState.state.resources.assignResources.selectedTaskId, assignedResources: resourcesForAssignation};

		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.resources.assignResources.selectedTaskId = '';
		ResourcesArray.forEach(resourceType => {
			newState.resources.assignResources[resourceType] = 0;
		});
		Context.interfaceState.setState(newState);
	} else if (isReleaseResourcesToTaskActionTemplate(actionRefUid)) {
		const resourcesForRelease : ResourceTypeAndNumber = {};

		ResourcesArray.forEach(resourceType => {
			const amount = Context.interfaceState.state.resources.releaseResources[resourceType];
			if(amount){
				resourcesForRelease[resourceType]= amount;
			}
		});

		params = {task: Context.interfaceState.state.resources.releaseResources.selectedTaskId, releasedResources: resourcesForRelease};

		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.resources.releaseResources.selectedTaskId = '';
		ResourcesArray.forEach(resourceType => {
			newState.resources.releaseResources[resourceType] = 0;
		});
		Context.interfaceState.setState(newState);
	} else if(isMethaneActionTemplate(actionRefUid)){

		params = fetchMethaneRequestValues();
	}

	actionClickHandler(Context.action.Uid, params);
}

export function fetchMethaneRequestValues(): MethanePayload {
		const methan = Context.interfaceState.state.methaneInformation;
		const request = Context.interfaceState.state.resources.requestedResources;
		const res = {
			major: methan.major,
			exact: methan.exact,
			incidentType: methan.incidentType,
			hazards: methan.hazards,
			access: methan.access,
			victims: methan.victims,
			resourceRequest: request
		};
		return res;
}
