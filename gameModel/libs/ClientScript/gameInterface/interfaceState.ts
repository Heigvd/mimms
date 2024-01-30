import { ActionType } from '../game/common/actionType';
import {
	ResourceContainerType,
	ResourceContainerTypeArray,
} from '../game/common/resources/resourceContainer';
import { getAllActors } from '../UIfacade/actorFacade';

export interface InterfaceState {
	currentActorUid: number;
	currentActionUid: number;
	showPatientModal: boolean;
	selectedPanel: 'actions' | 'radios' | 'notification';
	selectedMapObjectId: string;
	channel: string;
	channelText: {
		actors: string;
		evasam: string;
	};
	isReleaseResourceOpen: boolean;
	casuMessage: CasuMessage;
	resources: {
		sendResources: {
			selectedActorId: number;
		} & Resources;
		assignResources: {
			selectedTaskId: string;
		} & Resources;
		releaseResources: {
			selectedTaskId: string;
		} & Resources;
		requestedResources: Partial<
			Record<'ACS-MCS' | 'Ambulance' | 'SMUR' | 'PMA' | 'PICA' | 'PCS' | 'Helicopter', number>
		>;
	};
}

interface CasuMessage {
	messageType: string;
	major: string;
	exact: string;
	incidentType: string;
	hazards: string;
	access: string;
	victims: string;
}

interface Resources {
	secouriste: number;
	technicienAmbulancier: number;
	ambulancier: number;
	infirmier: number;
	medecinJunior: number;
	medecinSenior: number;
}

export function getInitialInterfaceState(): InterfaceState {
	return {
		currentActorUid: getAllActors()[0]!.Uid,
		currentActionUid: 0,
		casuMessage: {
			messageType: '',
			major: '',
			exact: '',
			incidentType: '',
			hazards: '',
			access: '',
			victims: '',
		},
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
		showPatientModal: false,
		selectedMapObjectId: '0',
		// selectedMapObject: '',
		selectedPanel: 'actions',
		channel: ActionType.CASU_RADIO,
		updatedChannelMessagesAt: 0,
		channelText: {
			actors: '',
			evasam: '',
		},
		isReleaseResourceOpen: false,
	};
}

export function getEmptyResourceRequest(): Partial<Record<ResourceContainerType, number>> {
	const resourceRequest: Partial<Record<ResourceContainerType, number>> = {};
	ResourceContainerTypeArray.forEach(t => {
		resourceRequest[t] = 0;
	});
	return resourceRequest;
}

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
