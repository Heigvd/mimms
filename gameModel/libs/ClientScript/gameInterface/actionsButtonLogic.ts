import { SendResourcesToActorActionInput } from "../game/common/actions/actionTemplateBase";
import { MethanePayload } from "../game/common/events/methaneEvent";
import { getAllContainerDefs } from "../game/common/resources/emergencyDepartment";
import { ResourceContainerDefinitionId, ResourceContainerType } from "../game/common/resources/resourceContainer";
import { ResourcesArray, ResourceTypeAndNumber } from "../game/common/resources/resourceType";
import { getEmptyResourceRequest } from "../gameInterface/interfaceState";
import { actionClickHandler } from "../gameInterface/main";
import { values } from "../tools/helper";
import { isAssignResourcesToTaskActionTemplate, isDefineMapObjectTemplate, isMethaneActionTemplate, isSendResourcesToActorActionTemplate } from "../UIfacade/actionFacade";


export function runActionButton(){
	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isDefineMapObjectTemplate(actionRefUid)) {
		params = Context.action.featureType;
	} else if (isSendResourcesToActorActionTemplate(actionRefUid)) {
		const sentResources2 : ResourceTypeAndNumber = {}

		ResourcesArray.forEach(res => {
			const amount = Context.interfaceState.state.resources.sendResources[res];
			if(amount){
				sentResources2[res]= amount;
			}
		});
		// TODO !! generate directly from ResourcesArray as above, but requires a foreach in wegas components and Context.variables renaming
		// for now hard coded to fit hardcoded interface
		const sentResources: ResourceTypeAndNumber = {
			'secouriste': Context.interfaceState.state.resources.sendResources.nbSecouristes,
			'technicienAmbulancier': Context.interfaceState.state.resources.sendResources.nbTechAmbulanciers,
			'ambulancier': Context.interfaceState.state.resources.sendResources.nbAmbulanciers,
			'infirmier': Context.interfaceState.state.resources.sendResources.nbInfirmiers,
			'medecinJunior': Context.interfaceState.state.resources.sendResources.nbMedJunior,
			'medecinSenior': Context.interfaceState.state.resources.sendResources.nbMedSenior,
		};

		// const sentResources: ResourceTypeAndNumber = [
		// 	{type: 'secouriste', nb: Context.interfaceState.state.resources.sendResources.nbSecouristes},
		// 	{type: 'technicienAmbulancier', nb: Context.interfaceState.state.resources.sendResources.nbTechAmbulanciers},
		// 	{type: 'ambulancier', nb: Context.interfaceState.state.resources.sendResources.nbAmbulanciers},
		// 	{type: 'infirmier', nb: Context.interfaceState.state.resources.sendResources.nbInfirmiers},
		// 	{type: 'medecinJunior', nb: Context.interfaceState.state.resources.sendResources.nbMedJunior},
		// 	{type: 'medecinSenior', nb: Context.interfaceState.state.resources.sendResources.nbMedSenior},
		// 	];

		const sendResourcesParams : SendResourcesToActorActionInput = {receiverActor: +Context.interfaceState.state.resources.sendResources.selectedActorId, sentResources};

		params = sendResourcesParams;

		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.resources.sendResources.nbSecouristes = '0';
		newState.resources.sendResources.nbTechAmbulanciers = '0';
		newState.resources.sendResources.nbAmbulanciers = '0';
		newState.resources.sendResources.nbInfirmiers = '0';
		newState.resources.sendResources.nbMedJunior = '0';
		newState.resources.sendResources.nbMedSenior = '0';
		Context.interfaceState.setState(newState);


	} else if (isAssignResourcesToTaskActionTemplate(actionRefUid)) {

		// TODO !! generate directly from ResourcesArray as above, but requires a foreach in wegas components and Context.variables renaming

		const assignedResources: ResourceTypeAndNumber = {
			'secouriste': Context.interfaceState.state.resources.assignTask.nbSecouristes,
			'technicienAmbulancier': Context.interfaceState.state.resources.assignTask.nbTechAmbulanciers,
			'ambulancier': Context.interfaceState.state.resources.assignTask.nbAmbulanciers,
			'infirmier': Context.interfaceState.state.resources.assignTask.nbInfirmiers,
			'medecinJunior': Context.interfaceState.state.resources.assignTask.nbMedJunior,
			'medecinSenior': Context.interfaceState.state.resources.assignTask.nbMedSenior,
		};

		params = {task: Context.interfaceState.state.resources.assignTask.selectedTaskId, assignedResources: assignedResources};

		const newState = Helpers.cloneDeep(Context.interfaceState.state)
		newState.resources.assignTask.selectedTaskId = '';
		newState.resources.assignTask.nbSecouristes = '0';
		newState.resources.assignTask.nbTechAmbulanciers = '0';
		newState.resources.assignTask.nbAmbulanciers = '0';
		newState.resources.assignTask.nbInfirmiers = '0';
		newState.resources.assignTask.nbMedJunior = '0';
		newState.resources.assignTask.nbMedSenior = '0';
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
