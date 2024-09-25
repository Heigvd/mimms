import {
  isCasuMessageActionTemplate,
  isEvacuationActionTemplate,
  isFixedMapEntityTemplate,
  isMoveActorActionTemplate,
  isMoveResourcesAssignTaskActionTemplate,
  isPretriageReportTemplate,
  isRadioActionTemplate,
} from '../UIfacade/actionFacade';
import { getSelectedActorLocation } from '../UIfacade/actorFacade';
import { ActionType } from '../game/common/actionType';
import {
  ActionTemplateBase,
  PretriageReportActionPayload,
} from '../game/common/actions/actionTemplateBase';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../game/common/events/casuMessageEvent';
import { BuildingStatus, FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { EvacuationActionPayload } from '../game/common/events/evacuationMessageEvent';
import { RadioMessagePayload } from '../game/common/events/radioMessageEvent';
import { ResourceTypeAndNumber, ResourcesArray } from '../game/common/resources/resourceType';
import { LOCATION_ENUM } from '../game/common/simulationState/locationState';
import { SelectedPanel } from '../gameInterface/selectedPanel';
import { clearMapState, startMapSelect } from '../gameMap/main';
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

/**
 * Performs logic whenever a template is initiated in interface
 *
 * @params ActionTemplateBase action being launched
 */
// used in several pages
export function runActionButton(action: ActionTemplateBase | undefined = undefined) {
  if (action != undefined) {
    Context.action = action;
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
  } else if (isMoveResourcesAssignTaskActionTemplate(action)) {
    params = fetchMoveResourcesAssignTaskValues();
  } else if (isCasuMessageActionTemplate(action)) {
    params = fetchCasuMessageRequestValues();
  } else if (isRadioActionTemplate(action, ActionType.CASU_RADIO)) {
    params = fetchRadioMessageRequestValues(ActionType.CASU_RADIO);
  } else if (isRadioActionTemplate(action, ActionType.ACTORS_RADIO)) {
    params = fetchRadioMessageRequestValues(ActionType.ACTORS_RADIO);
  } else if (isMoveActorActionTemplate(action)) {
    params = fetchMoveActorLocation();
  } else if (isEvacuationActionTemplate(action)) {
    params = fetchEvacuationActionValues();
  } else if (isPretriageReportTemplate(action)) {
    params = fetchPretriageReportActionValues();
  }

  actionClickHandler(Context.action, params);
}

/**
 * Generate a SelectMapObjectPayload from interface state
 *
 * @returns SelectMapObjectPayload
 */
function fetchSelectMapObjectValues() {
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
  let getEmptyFunc = function () {};
  let currentLoc: LOCATION_ENUM | undefined;
  const panel = Context.interfaceState.state.selectedPanel;
  if (panel === SelectedPanel.resources) {
    paramKey = 'allocateResources';
    getEmptyFunc = getEmptyAllocateResources;
    currentLoc = getSelectedActorLocation();
  } else if (panel === SelectedPanel.radios) {
    paramKey = 'allocateResourcesRadio';
    getEmptyFunc = getEmptyAllocateResourcesRadio;
    currentLoc = Context.interfaceState.state.resources[paramKey]?.currentLocation;
  }

  ResourcesArray.forEach(resourceType => {
    const amount = Context.interfaceState.state.resources[paramKey][resourceType];
    if (amount) {
      sentResources[resourceType] = amount;
    }
  });

  const payload = {
    // source fetched from drop down if radio, or actor location if location panel
    sourceLocation: currentLoc,
    targetLocation: Context.interfaceState.state.resources[paramKey]?.targetLocation,
    sentResources: sentResources,
    sourceTaskId: +Context.interfaceState.state.resources[paramKey].currentTaskId,
    targetTaskId: +Context.interfaceState.state.resources[paramKey].targetTaskId,
  };

  // Reset interfaceState
  const newState = Helpers.cloneDeep(Context.interfaceState.state);
  newState.resources[paramKey] = getEmptyFunc();
  Context.interfaceState.setState(newState);
  return payload;
}

/**
 * Generate a CasuMessagePayload from interface state
 *
 * @returns CasuMessagePayload
 */
function fetchCasuMessageRequestValues(): CasuMessagePayload {
  const casuMessage = Context.interfaceState.state.casuMessage;
  const request = Context.interfaceState.state.resources.requestedResources;
  const hospitalProximity = Context.interfaceState.state.getHospitalInfoChosenProximity;

  // For now only case where CasuMessage isn't METHANE related
  if (casuMessage.messageType === 'R') {
    const payload: HospitalRequestPayload = {
      messageType: casuMessage.messageType,
      proximity: hospitalProximity,
    };

    const newState = Helpers.cloneDeep(Context.interfaceState.state);
    newState.getHospitalInfoChosenProximity = undefined;
    Context.interfaceState.setState(newState);

    return payload;
  } else {
    const payload: MethaneMessagePayload = { messageType: casuMessage.messageType };

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
      payload.resourceRequest = request;
    }

    // Reset interfaceState
    const newState = Helpers.cloneDeep(Context.interfaceState.state);
    newState.resources.requestedResources = getEmptyResourceRequest();
    newState.casuMessage = {
      messageType: '',
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
function fetchRadioMessageRequestValues(channel: ActionType): RadioMessagePayload {
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
    pretriageLocation:
      Context.interfaceState.state.resourcesManagement.pretriageReportRequestLocation,
  };

  // Reset interface state
  //const newState = Helpers.cloneDeep(Context.interfaceState.state);
  //newState.evacuation = getEmptyEvacuationInterfaceState();
  //Context.interfaceState.setState(newState);

  return res;
}
