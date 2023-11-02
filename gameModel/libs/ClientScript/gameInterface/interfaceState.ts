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
			},
			selectedMapObjectId: '0',
			selectedMapObject: '',
		});
};


/**
 * Helper function, change only key-values give in update object
 */
export function setInterfaceState(update: object): void {
	const newState = Helpers.cloneDeep(Context.interfaceState.state);

	for (const key in update) {
		if (newState.hasOwnProperty(key)) {
			newState[key] = update[key as keyof typeof update];
		}
	}

	Context.interfaceState.setState(newState);
}