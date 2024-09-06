export enum ActionType {
  ACTION = 'ACTION',
  CASU_RADIO = 'CASU_RADIO',
  ACTORS_RADIO = 'ACTORS_RADIO',
  RESOURCES_RADIO = 'RESOURCES_RADIO',
  EVASAN_RADIO = 'EVASAN_RADIO',
  ALLOCATE_RESOURCES = 'ALLOCATE_RESOURCES',
  PRETRIAGE_REPORT = 'PRETRIAGE_REPORT',
  ACTIVATE_RADIO_CHANNELS = 'ACTIVATE_RADIO_CHANNELS',
}

export enum UniqueAction {
  SelectionPCFrontTemplate = 'SelectionPCFrontTemplate',
  SelectionPCSanTemplate = 'SelectionPCSanTemplate',
  MoveActorActionTemplate = 'MoveActorActionTemplate',
  AcsMcsArrivalAnnouncement = 'AcsMcsArrivalAnnouncement',
  OpenPmaActionTemplate = 'OpenPmaActionTemplate',
  CasuMessageTemplate = 'CasuMessageTemplate',
  ActivateRadioSchemaActionTemplate = 'ActivateRadioSchemaActionTemplate',
  MoveResourcesAssignTaskActionTemplate = 'MoveResourcesAssignTaskActionTemplate',
  PretriageReportTemplate = 'PretriageReportTemplate',
  EvacuationActionTemplate = 'EvacuationActionTemplate',
  // AppointActorActionTemplate_EVASAN = 'AppointActorActionTemplate_EVASAN',
  // AppointActorActionTemplate_LEADPMA = 'AppointActorActionTemplate_LEADPMA',
  // SelectionFixedMapEntityTemplate_AccReg = 'SelectionFixedMapEntityTemplate_AccReg',
  // SelectionFixedMapEntityTemplate_PMA = 'SelectionFixedMapEntityTemplate_PMA',
  // SelectionFixedMapEntityTemplate_nidDeBlesses = 'SelectionFixedMapEntityTemplate_nidDeBlesses',
  // SelectionParkTemplate_ambulance = 'SelectionParkTemplate_ambulance',
  // SelectionParkTemplate_helicopter = 'SelectionParkTemplate_helicopter',
  // SendRadioMessageTemplate_CASU_RADIO = 'SendRadioMessageTemplate_CASU_RADIO',
  // SendRadioMessageTemplate_ACTORS_RADIO = 'SendRadioMessageTemplate_ACTORS_RADIO',
}

export type RadioType =
  | ActionType.CASU_RADIO
  | ActionType.ACTORS_RADIO
  | ActionType.RESOURCES_RADIO
  | ActionType.EVASAN_RADIO;
