import { SendResourcesToActorActionInput } from "../game/common/actions/actionTemplateBase";
import { ResourceTypeAndNumber } from "../game/common/resources/resourceType";
import { actionClickHandler } from "../gameInterface/main";
import { isAssignResourcesToTaskActionTemplate, isDefineMapObjectTemplate, isSendResourcesToActorActionTemplate } from "../UIfacade/actionFacade";


export function runActionButton(){
	const actionRefUid = Context.action.Uid;

	let params = {};

	if (isDefineMapObjectTemplate(actionRefUid)) {
		params = Context.action.featureType;
	} else if (isSendResourcesToActorActionTemplate(actionRefUid)) {
		const sentResources: ResourceTypeAndNumber[] = [
			{type: 'secouriste', nb: Context.interfaceState.state.resources.sendResources.nbSecouristes},
			{type: 'technicienAmbulancier', nb: Context.interfaceState.state.resources.sendResources.nbTechAmbulanciers},
			{type: 'ambulancier', nb: Context.interfaceState.state.resources.sendResources.nbAmbulanciers},
			{type: 'infirmier', nb: Context.interfaceState.state.resources.sendResources.nbInfirmiers},
			{type: 'medecinJunior', nb: Context.interfaceState.state.resources.sendResources.nbMedJunior},
			{type: 'medecinSenior', nb: Context.interfaceState.state.resources.sendResources.nbMedSenior},
			];

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

		const assignedResources: ResourceTypeAndNumber[] = [
			{type: 'secouriste', nb: Context.interfaceState.state.resources.assignTask.nbSecouristes},
			{type: 'technicienAmbulancier', nb: Context.interfaceState.state.resources.assignTask.nbTechAmbulanciers},
			{type: 'ambulancier', nb: Context.interfaceState.state.resources.assignTask.nbAmbulanciers},
			{type: 'infirmier', nb: Context.interfaceState.state.resources.assignTask.nbInfirmiers},
			{type: 'medecinJunior', nb: Context.interfaceState.state.resources.assignTask.nbMedJunior},
			{type: 'medecinSenior', nb: Context.interfaceState.state.resources.assignTask.nbMedSenior},
			];		
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
	}

	actionClickHandler(Context.action.Uid, params);
}