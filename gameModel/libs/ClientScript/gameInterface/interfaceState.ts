import { ActionType } from '../game/common/actionType';
import { HospitalId, PatientId, TaskId } from '../game/common/baseTypes';
import {
  ResourceContainerType,
  ResourceContainerTypeArray,
} from '../game/common/resources/resourceContainer';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { mainSimLogger } from '../tools/logger';
import { getCurrentPlayerActors } from '../UIfacade/actorFacade';
import { SelectedPanel } from './selectedPanel';
import { ResourcesArray, ResourceType } from '../game/common/resources/resourceType';
import { HospitalProximity, PatientUnitTypology } from '../game/common/evacuation/hospitalType';
import { EvacuationSquadType } from '../game/common/evacuation/evacuationSquadDef';
import { getIdleTaskUid } from '../UIfacade/taskFacade';

export interface InterfaceState {
  currentActorUid: number | undefined;
  currentActionUid: number;
  moveActorChosenLocation: LOCATION_ENUM | undefined;
  getHospitalInfoChosenProximity: HospitalProximity | undefined;
  showPatientModal: boolean;
  selectedPatient: PatientId | undefined;
  timeForwardAwaitingConfirmation: boolean;
  showLeftPanel: boolean;
  selectedPanel: SelectedPanel;
  selectedMapObjectId: string;
  channel: string;
  updatedChannelMessagesAt: number;
  channelText: {
    actors: string;
  };
  casuMessage: CasuMessage;
  resources: {
    allocateResources: {
      currentTaskId: TaskId;
      targetLocation: LOCATION_ENUM | undefined;
      targetTaskId: TaskId | undefined;
    } & Partial<Record<ResourceType, number>>;
    allocateResourcesRadio: {
      currentLocation: LOCATION_ENUM | undefined;
      currentTaskId: TaskId;
      targetLocation: LOCATION_ENUM | undefined;
      targetTaskId: TaskId | undefined;
    } & Partial<Record<ResourceType, number>>;
    requestedResources: Partial<Record<ResourceContainerType, number>>;
  };
  evacuation: {
    data: {
      patientId: PatientId | undefined;
      hospitalId: HospitalId | undefined;
      patientUnitAtHospital: PatientUnitTypology | undefined;
      transportSquad: EvacuationSquadType | undefined;
      doResourcesComeBack: boolean;
    };
    form: {
      showPatientChoice: boolean;
      showDestinationChoice: boolean;
      showVectorChoice: boolean;
    };
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
    currentActorUid: getCurrentPlayerActors()[0]?.Uid,
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
      allocateResourcesRadio: getEmptyAllocateResourcesRadio(),
      requestedResources: getEmptyResourceRequest(),
    },
    evacuation: getEmptyEvacuationInterfaceState(),
    moveActorChosenLocation: undefined,
    getHospitalInfoChosenProximity: undefined,
    showPatientModal: false,
    selectedPatient: undefined,
    timeForwardAwaitingConfirmation: false,
    showLeftPanel: true,
    selectedMapObjectId: '0',
    // selectedMapObject: '',
    selectedPanel: SelectedPanel.actions,
    channel: ActionType.CASU_RADIO,
    updatedChannelMessagesAt: 0,
    channelText: {
      actors: '',
    },
  };
}

export function getEmptyAllocateResourcesRadio(): InterfaceState['resources']['allocateResourcesRadio'] {
  const resources = getEmptyResources();

  return {
    currentLocation: undefined,
    currentTaskId: getIdleTaskUid(),
    targetLocation: undefined,
    targetTaskId: undefined,
    ...resources,
  };
}

export function getEmptyAllocateResources(): InterfaceState['resources']['allocateResources'] {
  const resources = getEmptyResources();

  return {
    currentTaskId: getIdleTaskUid(),
    targetLocation: undefined,
    targetTaskId: undefined,
    ...resources,
  };
}

function getEmptyResources(): Partial<Record<ResourceType, number>> {
  const resources: Partial<Record<ResourceType, number>> = {};
  ResourcesArray.forEach(t => {
    resources[t] = 0;
  });
  return resources;
}

export function getEmptyResourceRequest(): Partial<Record<ResourceContainerType, number>> {
  const resourceRequest: Partial<Record<ResourceContainerType, number>> = {};
  ResourceContainerTypeArray.forEach(t => {
    resourceRequest[t] = 0;
  });
  return resourceRequest;
}

export function getEmptyEvacuationInterfaceState(): InterfaceState['evacuation'] {
  return {
    data: {
      patientId: undefined,
      hospitalId: undefined,
      patientUnitAtHospital: undefined,
      transportSquad: undefined,
      doResourcesComeBack: true,
    },
    form: {
      showPatientChoice: false,
      showDestinationChoice: false,
      showVectorChoice: false,
    },
  };
}

export function triggerInterfaceStateUpdate(state: InterfaceState) {
  if (state.currentActorUid === undefined && getCurrentPlayerActors().length > 0) {
    setInterfaceState({ currentActorUid: getCurrentPlayerActors()[0].Uid });
  }
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
