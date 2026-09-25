import {
  hasMapChoices,
  isAvailable,
  isCasuMessageActionTemplate,
  isChoiceTemplate,
  isCustomDurationActionTemplate,
  isEvacuationActionTemplate,
  isMoveActorActionTemplate,
  isMoveResourcesAssignTaskActionTemplate,
  isRadioActionTemplate,
} from '../UIfacade/actionFacade';
import {
  getResourceOrdersPayload,
} from '../UIfacade/resourceOrdersFacade';
import { ActionTemplateBase } from '../game/common/actions/actionTemplate/actionTemplateBase';
import { ChoiceDescriptor } from '../game/common/actions/choiceDescriptor/choiceDescriptor';
import { HospitalProximity } from '../game/common/evacuation/hospitalType';
import {
  CasuMessagePayload,
  HospitalRequestPayload,
  MethaneMessagePayload,
} from '../game/common/events/casuMessageEvent';
import { RadioMessagePayload } from '../game/common/events/radioMessageEvent';
import { RadioType } from '../game/common/radio/communicationType';
import { getChoiceDescriptor } from '../game/loaders/mapEntitiesLoader';
import { endMapAction, startMapChoice } from '../gameMap/main';
import { actionLogger } from '../tools/logger';
import {
  getEmptyResourceRequest,
  getTypedInterfaceState,
  setInterfaceState,
} from './interfaceState';
import { actionClickHandler, canPlanAction } from './main';
import { CustomDurationActionTemplateType } from '../game/common/actions/actionTemplate/actorTemplates';
import { getEvacuationOrderPayload } from '../UIfacade/evacuationFacade';

/**
 * Plans an action with a given template and the current interface state
 *
 * @params ActionTemplateBase action being launched
 */
// used in several pages
export function runActionButton(actTemplate: ActionTemplateBase | undefined): void {
  if (!actTemplate || !isAvailable(actTemplate)) {
    actionLogger.debug('action not available ' + JSON.stringify(actTemplate?.getTitle()));
    return;
  }
  actionLogger.debug('run action button for ' + JSON.stringify(actTemplate?.getTitle()));

  let params = {};

  if (isChoiceTemplate(actTemplate)) {
    if (!canPlanAction()) {
      // Action cancellation : we switch to the choice interface
      if (hasMapChoices(actTemplate)) {
        startMapChoice();
      }
    } else {
      params = fetchChoiceActionValues()!;
      endMapAction();
    }
  } else if (isMoveResourcesAssignTaskActionTemplate(actTemplate)) {
    params = getResourceOrdersPayload();
  } else if (isCasuMessageActionTemplate(actTemplate)) {
    params = fetchCasuMessageRequestValues();
  } else if (isRadioActionTemplate(actTemplate, RadioType.CASU)) {
    params = fetchRadioMessageRequestValues(RadioType.CASU);
  } else if (isRadioActionTemplate(actTemplate, RadioType.ACTORS)) {
    params = fetchRadioMessageRequestValues(RadioType.ACTORS);
  } else if (isMoveActorActionTemplate(actTemplate)) {
    params = fetchMoveActorLocation();
  } else if (isCustomDurationActionTemplate(actTemplate)) {
    params = fetchCustomDurationValues(actTemplate);
  } else if (isEvacuationActionTemplate(actTemplate)) {
    params = getEvacuationOrderPayload() || {};
  }

  actionClickHandler(actTemplate, params);
}

/**
 * Get the chosen ChoiceDescriptor based on interface state
 *
 * @returns ChoiceDescriptor | undefined
 */
function fetchChoiceActionValues(): ChoiceDescriptor | undefined {
  return getChoiceDescriptor(
    Context.interfaceState.state.currentActionUid,
    Context.interfaceState.state.selectedActionChoiceUid
  );
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
    const msgType = casuMessage.messageType as 'METHANE' | 'E';
    const payload: MethaneMessagePayload = {
      messageType: msgType,
      major: casuMessage.major,
      exact: casuMessage.exact,
      incidentType: casuMessage.incidentType,
      hazards: casuMessage.hazards,
      access: casuMessage.access,
      victims: casuMessage.victims,
      resourceRequest: resources.requestedResources,
    };

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

function fetchCustomDurationValues(at: CustomDurationActionTemplateType) {
  const customDurations = getTypedInterfaceState().customDurations;
  const params = { duration: customDurations[at.uid] };

  // Reset interfaceState
  const updatedState = { ...customDurations };
  updatedState[at.uid] = at.getSelectOptions().default;
  setInterfaceState({ customDurations: updatedState });

  return params;
}
