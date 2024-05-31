import { ActionType } from '../game/common/actionType';
import { TaskId } from '../game/common/baseTypes';
import {
  ResourceContainerType,
  ResourceContainerTypeArray,
} from '../game/common/resources/resourceContainer';
import { LOCATION_ENUM, HospitalProximity } from '../game/common/simulationState/locationState';
import { mainSimLogger } from '../tools/logger';
import { getAllActors } from '../UIfacade/actorFacade';
import { SelectedPanel } from './selectedPanel';

export interface InterfaceState {
  currentActorUid: number;
  currentActionUid: number;
  moveActorChosenLocation: LOCATION_ENUM | undefined;
  getHospitalInfoChosenProximity: HospitalProximity | undefined;
  showPatientModal: boolean;
  timeForwardAwaitingConfirmation: boolean;
  showLeftPanel: boolean;
  selectedPanel: SelectedPanel;
  selectedMapObjectId: string;
  channel: string;
  updatedChannelMessagesAt: number;
  channelText: {
    actors: string;
    evasam: string;
  };
  isReleaseResourceOpen: boolean;
  casuMessage: CasuMessage;
  resources: {
    allocateResources?: Partial<
      {
        currentLocation: LOCATION_ENUM | undefined;
        currentTaskId: TaskId | undefined;
        targetLocation: LOCATION_ENUM | undefined;
        targetTaskId: TaskId | undefined;
      } & Resources
    >;
    requestedResources?: Partial<
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
    timeForwardAwaitingConfirmation: false,
    showLeftPanel: true,
    selectedMapObjectId: '0',
    // selectedMapObject: '',
    selectedPanel: SelectedPanel.actions,
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
 * @param update, an object that only contains the change set to be applied to the interface state
 */
export function setInterfaceState(update: Partial<InterfaceState>): void {
  const newState = Helpers.cloneDeep(Context.interfaceState.state);

  function updateSubStateRecursive(
    src: Record<string, any>,
    target: Record<string, any>,
    depth: number
  ): void {
    if (depth > 20) {
      // safety break
      mainSimLogger.warn(
        'Stopping recursion on update of object, too much depth (circular reference ?)'
      );
      return;
    }
    for (const key in src) {
      const t = target[key];
      if (t && typeof t === 'object') {
        updateSubStateRecursive(src[key], t, ++depth);
      } else {
        // either a primitive or target was null thus assigning src object is ok
        target[key] = src[key];
      }
    }
  }
  updateSubStateRecursive(update, newState, 0);
  Context.interfaceState.setState(newState);
}
