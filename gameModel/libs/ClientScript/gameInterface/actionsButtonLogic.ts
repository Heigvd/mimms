import {
  getDefaultSituationUpdateDuration,
  isAvailable,
  isCasuMessageActionTemplate,
  isEvacuationActionTemplate,
  isFixedMapEntityTemplate,
  isMoveActorActionTemplate,
  isMoveResourcesAssignTaskActionTemplate,
  isPretriageReportTemplate,
  isRadioActionTemplate,
  isReduxTemplate,
  isSituationUpdateActionTemplate,
} from '../UIfacade/actionFacade';
import { getActor, getSelectedActorLocation } from '../UIfacade/actorFacade';
import { getReportLocationRequest, setReportLocationRequest } from '../UIfacade/resourceFacade';
import { initResourceManagementCurrentTaskId } from '../UIfacade/taskFacade';
import {
  ActionTemplateBase,
  PretriageReportActionPayload,
} from '../game/common/actions/actionTemplateBase';
import { Actor } from '../game/common/actors/actor';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../game/common/events/casuMessageEvent';
import { BuildingStatus, FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { EvacuationActionPayload } from '../game/common/events/evacuationMessageEvent';
import { RadioMessagePayload } from '../game/common/events/radioMessageEvent';
import { RadioType } from '../game/common/radio/communicationType';
import { CommMedia } from '../game/common/resources/resourceReachLogic';
import { ResourcesArray, ResourceTypeAndNumber } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { clearMapState, startMapSelect, startMapSelectRedux } from '../gameMap/main';
import { actionLogger } from '../tools/logger';
import {
  getEmptyAllocateResources,
  getEmptyAllocateResourcesRadio,
  getEmptyEvacuationInterfaceState,
  getEmptyResourceRequest,
  getTypedInterfaceState,
  setInterfaceState,
} from './interfaceState';
import { actionClickHandler, canPlanAction } from './main';
import { SelectedPanel } from './selectedPanel';
import { HospitalProximity } from '../game/common/evacuation/hospitalType';

/**
 * Plans an action with a given template and the current interface state
 *
 * @params ActionTemplateBase action being launched
 */
// used in several pages
export function runActionButton(action: ActionTemplateBase | undefined): void {
  if (!action || !isAvailable(action)) {
    actionLogger.debug('action not available ' + JSON.stringify(action?.getTitle()));
    return;
  }
  actionLogger.debug('run action button for ' + JSON.stringify(action?.getTitle()));

  let params = {};

  if (isFixedMapEntityTemplate(action)) {
    // If the action is already planned we cancel it in actionClickHandler and reinitialise the selectionState
    if (!canPlanAction()) {
      startMapSelect();
    } else {
      params = fetchSelectMapObjectValues()!;
      clearMapState();
    }
  } else if (isReduxTemplate(action)) {
    if (!canPlanAction()) {
      startMapSelectRedux();
    } else {
      params = fetchReduxValues();
      clearMapState();
    }
  } else if (isMoveResourcesAssignTaskActionTemplate(action)) {
    params = fetchMoveResourcesAssignTaskValues();
  } else if (isCasuMessageActionTemplate(action)) {
    params = fetchCasuMessageRequestValues();
  } else if (isRadioActionTemplate(action, RadioType.CASU)) {
    params = fetchRadioMessageRequestValues(RadioType.CASU);
  } else if (isRadioActionTemplate(action, RadioType.ACTORS)) {
    params = fetchRadioMessageRequestValues(RadioType.ACTORS);
  } else if (isMoveActorActionTemplate(action)) {
    params = fetchMoveActorLocation();
  } else if (isSituationUpdateActionTemplate(action)) {
    params = fetchSituationUpdateValues();
  } else if (isEvacuationActionTemplate(action)) {
    params = fetchEvacuationActionValues();
  } else if (isPretriageReportTemplate(action)) {
    params = fetchPretriageReportActionValues();
  }

  actionClickHandler(action, params);
}

/**
 * Generate a SelectMapObjectPayload from interface state
 *
 * @returns SelectMapObjectPayload
 */
function fetchSelectMapObjectValues(): FixedMapEntity | undefined {
  // TODO Add type

  const mapState = Context.mapState.state;
  let tmpFixedEntity;
  if (mapState.selectionState instanceof FixedMapEntity) {
    tmpFixedEntity = mapState.selectionState as FixedMapEntity;
    tmpFixedEntity.buildingStatus = BuildingStatus.inProgress;
    tmpFixedEntity.getGeometricalShape().selectedPosition =
      mapState.selectionState.getGeometricalShape().availablePositions[
        Context.interfaceState.state.selectedMapObjectId
      ];
  }

  return tmpFixedEntity;
}

/**
 * Generate a MoveResourcesAssignTaskPayload from interface state
 *
 * @returns MoveResourcesAssignTaskPayload
 */
function fetchMoveResourcesAssignTaskValues() {
  // TODO Add Type
  const sentResources: ResourceTypeAndNumber = {};

  let paramKey = '';
  let currentLoc: LOCATION_ENUM | undefined;
  let commMedia: CommMedia;
  const panel = Context.interfaceState.state.selectedPanel;
  if (panel === SelectedPanel.resources) {
    paramKey = 'allocateResources';
    currentLoc = getSelectedActorLocation();
    commMedia = CommMedia.Direct;
  } else {
    paramKey = 'allocateResourcesRadio';
    currentLoc = Context.interfaceState.state.resources[paramKey]?.currentLocation;
    commMedia = CommMedia.Radio;
  }

  ResourcesArray.forEach(resourceType => {
    const amount = Context.interfaceState.state.resources[paramKey][resourceType];
    if (amount) {
      sentResources[resourceType] = amount;
    }
  });

  const payload = {
    commMedia: commMedia,
    // source fetched from drop down if radio, or actor location if location panel
    sourceLocation: currentLoc,
    targetLocation: Context.interfaceState.state.resources[paramKey]?.targetLocation,
    sentResources: sentResources,
    sourceTaskId: +Context.interfaceState.state.resources[paramKey].currentTaskId,
    targetTaskId: +Context.interfaceState.state.resources[paramKey].targetTaskId,
  };

  // Reset interfaceState
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  if (panel === SelectedPanel.resources) {
    const currentActorUid: number | undefined = getTypedInterfaceState().currentActorUid;
    const currentActor: Readonly<Actor> | undefined = currentActorUid
      ? getActor(currentActorUid)
      : undefined;

    newState.resources[paramKey] = getEmptyAllocateResources();
    if (currentActor) {
      newState.resources[paramKey].currentTaskId = initResourceManagementCurrentTaskId(
        currentActor.Uid,
        currentActor.Location
      );
    }
  } else if (panel === SelectedPanel.radios) {
    newState.resources[paramKey] = getEmptyAllocateResourcesRadio();
  }
  Context.interfaceState.setState(newState);

  return payload;
}

/**
 * Generate a CasuMessagePayload from interface state
 *
 * @returns CasuMessagePayload
 */
function fetchCasuMessageRequestValues(): CasuMessagePayload {
  const { casuMessage, resources, hospitalInfoChosenProximity } = getTypedInterfaceState();

  // For now only case where CasuMessage isn't METHANE related
  if (casuMessage.messageType === 'R') {
    const payload: HospitalRequestPayload = {
      messageType: casuMessage.messageType,
      proximity: hospitalInfoChosenProximity || HospitalProximity.International,
    };

    const newState = Helpers.cloneDeep(Context.interfaceState.state);
    newState.hospitalInfoChosenProximity = undefined;
    Context.interfaceState.setState(newState);

    return payload;
  } else {
    const msgType = casuMessage.messageType as 'METHANE' | 'MET' | 'HANE' | 'E';
    const payload: MethaneMessagePayload = { messageType: msgType };

    if (casuMessage.messageType.startsWith('MET')) {
      payload.major = casuMessage.major;
      payload.exact = casuMessage.exact;
      payload.incidentType = casuMessage.incidentType;
    }
    if (casuMessage.messageType.endsWith('HANE')) {
      payload.hazards = casuMessage.hazards;
      payload.access = casuMessage.access;
      payload.victims = casuMessage.victims;
    }
    if (casuMessage.messageType.endsWith('E')) {
      payload.resourceRequest = resources.requestedResources;
    }

    // Reset interfaceState
    const newState = Helpers.cloneDeep(Context.interfaceState.state);
    newState.resources.requestedResources = getEmptyResourceRequest();
    newState.casuMessage = {
      messageType: newState.casuMessage.messageType,
      major: '',
      exact: '',
      incidentType: '',
      hazards: '',
      access: '',
      victims: '',
    };
    Context.interfaceState.setState(newState);

    return payload;
  }
}

/**
 * Generate a RadioMessagePayload from interface state
 *
 * @returns RadioMessagePayload
 */
function fetchRadioMessageRequestValues(channel: RadioType): RadioMessagePayload {
  const res = {
    message: getTypedInterfaceState().radioMessageInput[channel] ?? '',
    actorId: getTypedInterfaceState().currentActorUid!,
  };

  // Reset interfaceState
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.radioMessageInput[channel] = '';
  Context.interfaceState.setState(newState);

  return res;
}

function fetchReduxValues() {
  const uid = Context.interfaceState.state.reduxUid;
  setInterfaceState({ reduxUid: 'A' });
  return uid;
}

/**
 * Get chosen location for moveActorAction
 * @returns LOCATION_ENUM
 */
function fetchMoveActorLocation() {
  // Reset interfaceState
  const location = Context.interfaceState.state.moveActorChosenLocation;
  setInterfaceState({ moveActorChosenLocation: undefined });
  return location;
}

function fetchSituationUpdateValues() {
  const params = { duration: +getTypedInterfaceState().situationUpdateDuration };
  // Reset interfaceState
  setInterfaceState({ situationUpdateDuration: getDefaultSituationUpdateDuration() });
  return params;
}

function fetchEvacuationActionValues() {
  const res: EvacuationActionPayload = { ...Context.interfaceState.state.evacuation.data };

  // Reset interface state
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.evacuation = getEmptyEvacuationInterfaceState();
  Context.interfaceState.setState(newState);

  return res;
}

function fetchPretriageReportActionValues() {
  const res: PretriageReportActionPayload = {
    pretriageLocation: getReportLocationRequest()!,
  };

  // Reset interface state
  setReportLocationRequest(undefined);

  return res;
}
