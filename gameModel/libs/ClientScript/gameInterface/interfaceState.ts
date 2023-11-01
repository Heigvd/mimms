import {
	ResourceContainerType,
	ResourceContainerTypeArray,
} from '../game/common/resources/resourceContainer';
import { getAllActors } from '../UIfacade/actorFacade';

export function getInitialInterfaceState() {
	return {
		currentActorUid: getAllActors()[0]!.Uid,
		currentActionUid: 0,
		resources: {
			sendResources: {
				selectedActorId: getAllActors()[0]!.Uid,
				// the keywords must be those of HumanResourceTypeArray
				secouriste: 0,
				technicienAmbulancier: 0,
				ambulancier: 0,
				infirmier: 0,
				medecinJunior: 0,
				medecinSenior: 0,
			},
			assignResources: {
				selectedTaskId: '',
				// the keywords must be those of HumanResourceTypeArray
				secouriste: 0,
				technicienAmbulancier: 0,
				ambulancier: 0,
				infirmier: 0,
				medecinJunior: 0,
				medecinSenior: 0,
			},
			releaseResources: {
				selectedTaskId: '',
				// the keywords must be those of HumanResourceTypeArray
				secouriste: 0,
				technicienAmbulancier: 0,
				ambulancier: 0,
				infirmier: 0,
				medecinJunior: 0,
				medecinSenior: 0,
			},

			requestedResources: getEmptyResourceRequest(),
		},
	};
	
}

export function getEmptyResourceRequest(): Partial<Record<ResourceContainerType, number>> {
	const resourceRequest: Partial<Record<ResourceContainerType, number>> = {};
	ResourceContainerTypeArray.forEach(t => {
		resourceRequest[t] = 0;
	});
	return resourceRequest;
}
