import { getAllActors } from "../UIfacade/actorFacade";

export function getInitialInterfaceState(){

	return ({
			currentActorUid: getAllActors()[0].Uid,
			currentActionUid: 0,
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
					}
				}
		});
}