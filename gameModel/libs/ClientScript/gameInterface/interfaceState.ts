import { ResourceContainerType, ResourceContainerTypeArray } from "../game/common/resources/resourceContainer";
import { getAllActors } from "../UIfacade/actorFacade";

export function getInitialInterfaceState(){

	
	

	return ({
		currentActorUid: getAllActors()[0].Uid,
		currentActionUid: 0,
		// TODO generate dynamically from typings and definitions
		resources: {
			sendResources: {
				selectedActorId: getAllActors()[0].Uid,
				nbSecouristes: '0',
				nbTechAmbulanciers: '0',
				nbAmbulanciers: '0',
				nbInfirmiers: '0',
				nbMedJunior: '0',
				nbMedSenior: '0'
			},
			assignTask: {
				selectedTaskId: '',
				nbSecouristes: '0',
				nbTechAmbulanciers: '0',
				nbAmbulanciers: '0',
				nbInfirmiers: '0',
				nbMedJunior: '0',
				nbMedSenior: '0'
			},
			
			requestedResources : getEmptyResourceRequest()
		}
	});
}

export function getEmptyResourceRequest(): Partial<Record<ResourceContainerType, number>> {
	const resourceRequest : Partial<Record<ResourceContainerType, number>>= {};
	ResourceContainerTypeArray.forEach((t) => {resourceRequest[t]= 0})
	return resourceRequest;
}