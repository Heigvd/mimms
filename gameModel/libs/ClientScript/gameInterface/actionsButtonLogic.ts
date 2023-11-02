import { RequestResourceFromActorActionInput, SendResourcesToActorActionInput } from "../game/common/actions/actionTemplateBase";
import { ResourceFunctionAndNumber } from "../game/common/resources/resourceFunction";
import { ResourceTypeAndNumber } from "../game/common/resources/resourceType";
import { actionClickHandler, canPlanAction } from "../gameInterface/main";
import { clearMapState, startMapSelect } from "../gameMap/main";
import { getActionTemplate, isAssignResourcesToTaskActionTemplate, isDefineMapObjectTemplate, isRequestResourcesFromActorActionTemplate, isSelectMapObjectTemplate, isSendResourcesToActorActionTemplate, planAction } from "../UIfacade/actionFacade";


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
					geometryType: mapState.selectionState.geoemtryType,
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
	} else if (isRequestResourcesFromActorActionTemplate(actionRefUid)) {
		//to be removed
		const chosenActor = Variable.find(gameModel, 'requestRecipientActor').getValue(self);
		const chosenNbPretrieurs = +Variable.find(gameModel, 'chosenNbPretrieursB').getValue(self);
		const requestedResources: ResourceFunctionAndNumber[] = [{ function: 'Pretrieur', nb: chosenNbPretrieurs }];

		const requestResourceParams: RequestResourceFromActorActionInput = { recipientActor: chosenActor, requestedResources };

		params = requestResourceParams;
	} else if (isSendResourcesToActorActionTemplate(actionRefUid)) {

		const sentResources: ResourceTypeAndNumber[] = [
			{ type: 'secouriste', nb: Context.interfaceState.state.resources.sendResources.nbSecouristes },
			{ type: 'technicienAmbulancier', nb: Context.interfaceState.state.resources.sendResources.nbTechAmbulanciers },
			{ type: 'ambulancier', nb: Context.interfaceState.state.resources.sendResources.nbAmbulanciers },
			{ type: 'infirmier', nb: Context.interfaceState.state.resources.sendResources.nbInfirmiers },
			{ type: 'medecinJunior', nb: Context.interfaceState.state.resources.sendResources.nbMedJunior },
			{ type: 'medecinSenior', nb: Context.interfaceState.state.resources.sendResources.nbMedSenior },
		];

		const sendResourcesParams: SendResourcesToActorActionInput = { receiverActor: +Context.interfaceState.state.resources.sendResources.selectedActorId, sentResources };

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
			{ type: 'secouriste', nb: Context.interfaceState.state.resources.assignTask.nbSecouristes },
			{ type: 'technicienAmbulancier', nb: Context.interfaceState.state.resources.assignTask.nbTechAmbulanciers },
			{ type: 'ambulancier', nb: Context.interfaceState.state.resources.assignTask.nbAmbulanciers },
			{ type: 'infirmier', nb: Context.interfaceState.state.resources.assignTask.nbInfirmiers },
			{ type: 'medecinJunior', nb: Context.interfaceState.state.resources.assignTask.nbMedJunior },
			{ type: 'medecinSenior', nb: Context.interfaceState.state.resources.assignTask.nbMedSenior },
		];
		params = { task: Context.interfaceState.state.resources.assignTask.selectedTaskId, assignedResources: assignedResources };

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