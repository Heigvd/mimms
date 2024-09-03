import { getAvailableActions } from '../../../UIfacade/actionFacade';
import { ActionType } from '../actionType';
import { ActionTemplateBase, ActivateRadioSchemaActionTemplate } from './actionTemplateBase';

export enum UniqueAction {
  CasuMessageTemplate = 'CasuMessageTemplate',
  PretriageReportTemplate = 'PretriageReportTemplate',
  ActivateRadioSchemaActionTemplate = 'ActivateRadioSchemaActionTemplate',
  SelectionPCFrontTemplate = 'SelectionPCFrontTemplate',
  SelectionPCTemplate = 'SelectionPCTemplate',
  MoveResourcesAssignTaskActionTemplate = 'MoveResourcesAssignTaskActionTemplate',
  MoveActorActionTemplate = 'MoveActorActionTemplate',
  EvacuationActionTemplate = 'EvacuationActionTemplate',
  OpenPmaActionTemplate = 'OpenPmaActionTemplate',
  AcsMcsArrivalAnnouncement = 'AcsMcsArrivalAnnouncement',
  SelectionParkTemplate_ambulance = 'SelectionParkTemplate_ambulance',
  SelectionParkTemplate_helicopter = 'SelectionParkTemplate_helicopter',
  AppointActorActionTemplate_EVASAN = 'AppointActorActionTemplate_EVASAN',
  AppointActorActionTemplate_LEADPMA = 'AppointActorActionTemplate_LEADPMA',
  SelectionFixedMapEntityTemplate_AccReg = 'SelectionFixedMapEntityTemplate_AccReg',
  SelectionFixedMapEntityTemplate_PMA = 'SelectionFixedMapEntityTemplate_PMA',
  SelectionFixedMapEntityTemplate_nidDeBlesses = 'SelectionFixedMapEntityTemplate_nidDeBlesses',
  SendRadioMessageTemplate_CASU_RADIO = 'SendRadioMessageTemplate_CASU_RADIO',
  SendRadioMessageTemplate_ACTORS_RADIO = 'SendRadioMessageTemplate_ACTORS_RADIO',
}

export function getRadioChannelsActivationTemplate(): ActionTemplateBase | undefined {
  const matchingActions = getAvailableActions(
    Context.interfaceState.state.currentActorUid,
    ActionType.ACTIVATE_RADIO_CHANNELS
  ).filter(action => action instanceof ActivateRadioSchemaActionTemplate);

  if (matchingActions.length === 1) {
    return matchingActions[0];
  }

  return undefined;
}
