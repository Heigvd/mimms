import { MethanePayload } from '../game/common/events/methaneEvent';
import { ResourcesArray, ResourceTypeAndNumber } from '../game/common/resources/resourceType';
import {
	isAssignResourcesToTaskActionTemplate,
	isDefineMapObjectTemplate,
	isMethaneActionTemplate,
	isReleaseResourcesToTaskActionTemplate,
	isSendResourcesToActorActionTemplate,
} from '../UIfacade/actionFacade';
import { getAllActors } from '../UIfacade/actorFacade';
import { getEmptyResourceRequest } from './interfaceState';
import { actionClickHandler } from './main';

export function runActionButton(){
	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isDefineMapObjectTemplate(actionRefUid)) {
		params = Context.action.featureType;

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
		// TODO generate dynamically from container definitions
		// here tested with two actors defs and one resource def
		/*
		const cdefs = getAllContainerDefs();
		const acsDef = values(cdefs).find((def) => def.type === 'ACS')!; // TODO remove that
		const mcsDef = values(cdefs).find((def) => def.type === 'MCS')!; // TODO remove that
		const emAmb = values(cdefs).find((def) => def.type === 'Ambulance')!; // TODO remove that

		const requestedResources : Partial<Record<ResourceContainerType, number>> = {};
		requestedResources[acsDef.type] = Context.interfaceState.state.resources.requestedResources.nbAcs;
		requestedResources[mcsDef.type] = Context.interfaceState.state.resources.requestedResources.nbMcs;
		requestedResources[emAmb.type] = Context.interfaceState.state.resources.requestedResources.nbAmb;
		*/
		const request = Context.interfaceState.state.resources.requestedResources;
		
		const newState = Helpers.cloneDeep(Context.interfaceState.state);
		newState.resources.requestedResources = getEmptyResourceRequest();
		Context.interfaceState.setState(newState);

		// TODO cleaner and get all the fields
		const res = {otherStuff : 'METHAN..... stuff', resourceRequest: request};
		wlog(res);
		return res;
}
