import { ActionType } from '../game/common/actionType';
import { TaskId } from '../game/common/baseTypes';
import {
  ResourceContainerType,
  ResourceContainerTypeArray,
} from '../game/common/resources/resourceContainer';
import { LOCATION_ENUM, HospitalProximity } from '../game/common/simulationState/locationState';
import { getAllActors } from '../UIfacade/actorFacade';
import { SelectedPanel } from './selectedPanel';

export interface InterfaceState {
  currentActorUid: number;
  currentActionUid: number;
  moveActorChosenLocation: LOCATION_ENUM | undefined;
  getHospitalInfoChosenProximity: HospitalProximity | undefined;
  showPatientModal: boolean;
  selectedPanel: SelectedPanel;
  selectedMapObjectId: string;
  channel: string;
  updatedChannelMessagesAt: number;
  channelText: {
    actors: string;
    evasam: string;
  };
  casuMessage: CasuMessage;
  resources: {
    allocateResources: {
      currentLocation: LOCATION_ENUM | undefined;
      currentTaskId: TaskId | undefined;
      targetLocation: LOCATION_ENUM | undefined;
      targetTaskId: TaskId | undefined;
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

// used in page 43
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
      allocateResources: {
        currentLocation: undefined,
        currentTaskId: undefined,
        targetLocation: undefined,
        targetTaskId: undefined,
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
    moveActorChosenLocation: undefined,
    getHospitalInfoChosenProximity: undefined,
    showPatientModal: false,
    selectedMapObjectId: '0',
    // selectedMapObject: '',
    selectedPanel: SelectedPanel.actions,
    channel: ActionType.CASU_RADIO,
    updatedChannelMessagesAt: 0,
    channelText: {
      actors: '',
      evasam: '',
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
