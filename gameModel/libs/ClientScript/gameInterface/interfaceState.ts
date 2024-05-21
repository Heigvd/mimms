import { ActionType } from '../game/common/actionType';
import { TaskId } from '../game/common/baseTypes';
import {
  ResourceContainerType,
  ResourceContainerTypeArray,
} from '../game/common/resources/resourceContainer';
import { LOCATION_ENUM, HospitalProximity } from '../game/common/simulationState/locationState';
import { getAllActors } from '../UIfacade/actorFacade';
import { SelectedPanel } from './selectedPanel';
import { ResourcesArray, ResourceType } from '../game/common/resources/resourceType';

export interface InterfaceState {
  currentActorUid: number;
  currentActionUid: number;
  moveActorChosenLocation: LOCATION_ENUM | undefined;
  getHospitalInfoChosenProximity: HospitalProximity | undefined;
  showPatientModal: boolean;
  showLeftPanel: boolean;
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
    } & Partial<Record<ResourceType, number>>;
    requestedResources: Partial<Record<ResourceContainerType, number>>;
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
      allocateResources: getEmptyAllocateResources(),
      requestedResources: getEmptyResourceRequest(),
    },
    moveActorChosenLocation: undefined,
    getHospitalInfoChosenProximity: undefined,
    showPatientModal: false,
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
  };
}
export function getEmptyAllocateResources(): InterfaceState['resources']['allocateResources'] {
  const resources: Partial<Record<ResourceType, number>> = {};
  ResourcesArray.forEach(t => {
    resources[t] = 0;
  });

  return {
    currentLocation: undefined,
    currentTaskId: undefined,
    targetLocation: undefined,
    targetTaskId: undefined,
    ...resources,
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
