import {
  ActionTemplateBase,
  ActivateRadioSchemaActionTemplate,
  AppointActorActionTemplate,
  CasuMessageTemplate,
  DisplayMessageActionTemplate,
  EvacuationActionTemplate,
  MoveActorActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
  PretriageReportTemplate,
  MapChoiceActionTemplate,
  SendRadioMessageTemplate,
  SimFlag,
  SituationUpdateActionTemplate,
  ParkChoiceTemplate,
  PCChoiceTemplate,
  PCFrontChoiceTemplate,
} from './common/actions/actionTemplateBase';
import { ActionType } from './common/actionType';
import { TimeSliceDuration } from './common/constants';
import { RadioType } from './common/radio/communicationType';
import { LOCATION_ENUM } from './common/simulationState/locationState';
import {
  getAccregChoices,
  getAmbulanceChoices,
  getHelicopterChoices,
  getNestChoices,
  getPCChoices,
  getPCFrontChoices,
  getPMAChoices,
} from './loaders/choiceLoader';

export interface IUniqueActionTemplates {
  readonly PCFrontChoiceTemplate: PCFrontChoiceTemplate;
  readonly PCChoiceTemplate: PCChoiceTemplate;
  readonly MoveActorActionTemplate: MoveActorActionTemplate;
  readonly AcsMcsArrivalAnnouncement: DisplayMessageActionTemplate;
  readonly EvasanArrivalAnnouncement: DisplayMessageActionTemplate;
  readonly LeadpmaArrivalAnnouncement: DisplayMessageActionTemplate;
  readonly OpenPmaActionTemplate: DisplayMessageActionTemplate;
  readonly CasuMessageTemplate: CasuMessageTemplate;
  readonly ActivateRadioSchemaActionTemplate: ActivateRadioSchemaActionTemplate;
  readonly MoveResourcesAssignTaskActionTemplate: MoveResourcesAssignTaskActionTemplate;
  readonly PretriageReportTemplate: PretriageReportTemplate;
  readonly EvacuationActionTemplate: EvacuationActionTemplate;
  readonly ActorSendRadioMessageTemplate: SendRadioMessageTemplate;
  readonly CasuSendRadioMessageTemplate: SendRadioMessageTemplate;
  readonly SituationUpdateActionTemplate: SituationUpdateActionTemplate;
}

export function initActionTemplates(): {
  actionTemplates: Record<string, ActionTemplateBase>;
  uniqueActionTemplates: IUniqueActionTemplates;
} {
  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const pcFrontChoice = new PCFrontChoiceTemplate(
    'define-pcFront-title',
    'define-pcFront-desc',
    TimeSliceDuration,
    'define-pcFront-feedback',
    false,
    [],
    [SimFlag.PCFRONT_BUILT],
    undefined,
    getPCFrontChoices()
  );

  const moveActor = new MoveActorActionTemplate(
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration,
    'move-actor-feedback'
  );

  const getInfo = new DisplayMessageActionTemplate(
    'basic-info-title',
    'basic-info-desc',
    TimeSliceDuration * 2,
    'basic-info-feedback'
  );
  const getInfo2 = new DisplayMessageActionTemplate(
    'other-basic-info-title',
    'other-basic-info-desc',
    TimeSliceDuration,
    'other-basic-info-feedback'
  );
  const getPoliceInfos = new DisplayMessageActionTemplate(
    'basic-info-police-title',
    'basic-info-police-desc',
    TimeSliceDuration,
    'basic-info-police-feedback'
  );
  const getFireFighterInfos = new DisplayMessageActionTemplate(
    'basic-info-firefighter-title',
    'basic-info-firefighter-desc',
    TimeSliceDuration,
    'basic-info-firefighter-feedback'
  );
  const casuMessage = new CasuMessageTemplate(
    'casu-message-title',
    'casu-message-desc',
    TimeSliceDuration,
    'casu-message-feedback'
  );

  const actorFreeRadioMessage = new SendRadioMessageTemplate(
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    'send-radio-feedback',
    RadioType.ACTORS,
    true,
    ActionType.ACTORS_RADIO
  );

  const casuFreeRadioMessage = new SendRadioMessageTemplate(
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    'send-radio-feedback',
    RadioType.CASU,
    true,
    ActionType.CASU_RADIO
  );

  const ambulanceParkChoice = new ParkChoiceTemplate(
    'define-ambulance-park-title',
    'define-ambulance-park-desc',
    TimeSliceDuration,
    'define-ambulance-park-feedback',
    false,
    LOCATION_ENUM.ambulancePark,
    'ambulance',
    undefined,
    [SimFlag.AMBULANCE_PARK_BUILT],
    undefined,
    getAmbulanceChoices()
  );

  const helicopterParkChoice = new ParkChoiceTemplate(
    'define-helicopter-park-title',
    'define-helicopter-park-desc',
    TimeSliceDuration,
    'define-helicopter-park-feedback',
    false,
    LOCATION_ENUM.helicopterPark,
    'ambulance',
    undefined,
    [SimFlag.HELICOPTER_PARK_BUILT],
    undefined,
    getHelicopterChoices()
  );

  const nestChoice = new MapChoiceActionTemplate(
    'define-Nest-title',
    'define-Nest-desc',
    TimeSliceDuration,
    'define-Nest-feedback',
    false,
    undefined,
    undefined,
    undefined,
    getNestChoices(),
    LOCATION_ENUM.nidDeBlesses
  );

  const accessRegressChoice = new MapChoiceActionTemplate(
    'define-accreg-title',
    'define-accreg-desc',
    TimeSliceDuration,
    'define-accreg-feedback',
    false,
    undefined,
    undefined,
    undefined,
    getAccregChoices(),
    LOCATION_ENUM.AccReg
  );

  const pmaChoice = new MapChoiceActionTemplate(
    'define-PMA-title',
    'define-PMA-desc',
    TimeSliceDuration,
    'define-PMA-feedback',
    false,
    undefined,
    [SimFlag.PMA_BUILT],
    undefined,
    getPMAChoices(),
    LOCATION_ENUM.PMA
  );

  const pcChoice = new PCChoiceTemplate(
    'define-PC-title',
    'define-PC-desc',
    TimeSliceDuration * 2,
    'define-PC-feedback',
    false,
    undefined,
    [SimFlag.PC_BUILT],
    undefined,
    getPCChoices()
  );

  const openPMA = new DisplayMessageActionTemplate(
    'open-PMA-title',
    'open-PMA-desc',
    TimeSliceDuration,
    'open-PMA-feedback',
    false,
    [SimFlag.PMA_BUILT],
    [SimFlag.PMA_OPEN],
    ['LEADPMA'],
    RadioType.RESOURCES
  );

  const acsMcsArrivalAnnouncement = new DisplayMessageActionTemplate(
    'define-acsMscArrival-title',
    'define-acsMscArrival-desc',
    TimeSliceDuration,
    'define-acsMscArrival-feedback',
    false,
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.ACS_MCS_ANNOUNCED],
    ['ACS', 'MCS'],
    RadioType.CASU
  );

  const evasanArrivalAnnouncement = new DisplayMessageActionTemplate(
    'define-evasanArrival-title',
    'define-evasanArrival-desc',
    TimeSliceDuration,
    'define-evasanArrival-feedback',
    false,
    [SimFlag.EVASAN_ARRIVED],
    [SimFlag.EVASAN_ANNOUNCED],
    ['EVASAN'],
    RadioType.EVASAN
  );

  const leadpmaArrivalAnnouncement = new DisplayMessageActionTemplate(
    'define-leadpmaArrival-title',
    'define-leadpmaArrival-desc',
    TimeSliceDuration,
    'define-leadpmaArrival-feedback',
    false,
    [SimFlag.LEADPMA_ARRIVED],
    [SimFlag.LEADPMA_ANNOUNCED],
    ['LEADPMA'],
    RadioType.ACTORS
  );

  const activateRadioSchema = new ActivateRadioSchemaActionTemplate(
    'activate-radio-schema-title',
    'activate-radio-schema-desc',
    TimeSliceDuration,
    'activate-radio-schema-feedback',
    'activate-radio-schema-request',
    'activate-radio-schema-reply-ok',
    'activate-radio-schema-reply-unauthorized',
    RadioType.CASU,
    true
  );

  const appointEVASAN = new AppointActorActionTemplate(
    'appoint-EVASAN-title',
    'appoint-EVASAN-desc',
    TimeSliceDuration,
    'appoint-EVASAN-feedback',
    true,
    'appoint-EVASAN-no-resource-feedback',
    'appoint-refusal-feedback',
    'EVASAN',
    ['ambulancier'],
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.EVASAN_ARRIVED]
  );

  const appointLeadPMA = new AppointActorActionTemplate(
    'appoint-LeadPMA-title',
    'appoint-LeadPMA-desc',
    TimeSliceDuration,
    'appoint-LeadPMA-feedback',
    true,
    'appoint-LeadPMA-no-resource-feedback',
    'appoint-refusal-feedback',
    'LEADPMA',
    ['infirmier', 'ambulancier'],
    [SimFlag.PMA_BUILT, SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.LEADPMA_ARRIVED]
  );

  const allocateResources = new MoveResourcesAssignTaskActionTemplate(
    'move-res-task-title',
    'move-res-task-desc',
    TimeSliceDuration,
    'move-res-task-feedback',
    true
  );

  const evacuate = new EvacuationActionTemplate(
    'evacuate-title',
    'evacuate-desc',
    TimeSliceDuration,
    'evacuate-feedback',
    'evacuate-task-request',
    'evacuate-task-started',
    'evacuate-feedback-return',
    'evacuate-task-abort',
    'evacuate-task-refused',
    true
  );

  const pretriageReport = new PretriageReportTemplate(
    'pretriage-report-task-title',
    'pretriage-report-task-desc',
    TimeSliceDuration,
    'pretriage-report-task-feedback-started',
    'pretriage-report-task-feedback-report',
    true
  );

  const situationUpdate = new SituationUpdateActionTemplate(
    'situation-update-title',
    'situation-update-desc',
    'situation-update-feedback'
  );

  const templates: Record<string, ActionTemplateBase> = {};
  templates[ambulanceParkChoice.Uid] = ambulanceParkChoice;
  templates[helicopterParkChoice.Uid] = helicopterParkChoice;
  templates[nestChoice.Uid] = nestChoice;
  templates[accessRegressChoice.Uid] = accessRegressChoice;
  templates[pmaChoice.Uid] = pmaChoice;
  templates[pcChoice.Uid] = pcChoice;
  templates[pcFrontChoice.Uid] = pcFrontChoice;
  templates[moveActor.Uid] = moveActor;
  templates[getInfo.Uid] = getInfo;
  templates[getInfo2.Uid] = getInfo2;
  templates[getPoliceInfos.Uid] = getPoliceInfos;
  templates[getFireFighterInfos.Uid] = getFireFighterInfos;
  templates[openPMA.Uid] = openPMA;
  templates[acsMcsArrivalAnnouncement.Uid] = acsMcsArrivalAnnouncement;
  templates[evasanArrivalAnnouncement.Uid] = evasanArrivalAnnouncement;
  templates[leadpmaArrivalAnnouncement.Uid] = leadpmaArrivalAnnouncement;
  templates[activateRadioSchema.Uid] = activateRadioSchema;
  templates[casuMessage.Uid] = casuMessage;
  templates[actorFreeRadioMessage.Uid] = actorFreeRadioMessage;
  templates[casuFreeRadioMessage.Uid] = casuFreeRadioMessage;
  templates[appointEVASAN.Uid] = appointEVASAN;
  templates[appointLeadPMA.Uid] = appointLeadPMA;
  templates[allocateResources.Uid] = allocateResources;
  templates[evacuate.Uid] = evacuate;
  templates[pretriageReport.Uid] = pretriageReport;
  templates[situationUpdate.Uid] = situationUpdate;

  // Beware that the order of the actions of the standard list depends on the creation order

  return {
    actionTemplates: templates,
    uniqueActionTemplates: {
      PCFrontChoiceTemplate: pcFrontChoice,
      PCChoiceTemplate: pcChoice,
      MoveActorActionTemplate: moveActor,
      AcsMcsArrivalAnnouncement: acsMcsArrivalAnnouncement,
      EvasanArrivalAnnouncement: evasanArrivalAnnouncement,
      LeadpmaArrivalAnnouncement: leadpmaArrivalAnnouncement,
      OpenPmaActionTemplate: openPMA,
      CasuMessageTemplate: casuMessage,
      ActivateRadioSchemaActionTemplate: activateRadioSchema,
      MoveResourcesAssignTaskActionTemplate: allocateResources,
      PretriageReportTemplate: pretriageReport,
      EvacuationActionTemplate: evacuate,
      ActorSendRadioMessageTemplate: actorFreeRadioMessage,
      CasuSendRadioMessageTemplate: casuFreeRadioMessage,
      SituationUpdateActionTemplate: situationUpdate,
    },
  };
}
