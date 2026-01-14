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
  SendRadioMessageTemplate,
  SimFlag,
  SituationUpdateActionTemplate,
} from './common/actions/actionTemplateBase';
import { ActionType } from './common/actionType';
import { ActionTemplateUid } from './common/baseTypes';
import { TimeSliceDuration } from './common/constants';
import { RadioType } from './common/radio/communicationType';
import { ActionTemplateData } from './loaders/actionTemplateLoader';

export interface IUniqueActionTemplates {
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

export function initActionTemplates(): ActionTemplateData {
  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  // TODO those instances will be created from the templates descriptor data through the actionTemplateFactory
  /*
  const pcFrontChoice = new PCFrontChoiceTemplate(
    'define-pcFront-uid-qwe',
    'define-pcFront-title',
    'define-pcFront-desc',
    TimeSliceDuration,
    //'define-pcFront-feedback',
    false,
    [],
    [SimFlag.PCFRONT_BUILT],
    undefined,
    getPCFrontChoices()
  );
*/
  const moveActor = new MoveActorActionTemplate(
    'move-actor-uid-wer',
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration
  );

  const casuMessage = new CasuMessageTemplate(
    'casu-message-uid-uio',
    'casu-message-title',
    'casu-message-desc',
    TimeSliceDuration
  );

  const actorFreeRadioMessage = new SendRadioMessageTemplate(
    'send-radio-actor-uid-iop',
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    RadioType.ACTORS,
    true,
    ActionType.ACTORS_RADIO
  );

  const casuFreeRadioMessage = new SendRadioMessageTemplate(
    'send-radio-casu-uid-asd',
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    RadioType.CASU,
    true,
    ActionType.CASU_RADIO
  );
  /*
  const ambulanceParkChoice = new ParkChoiceTemplate(
    'define-ambulance-park-uid-sdf',
    'define-ambulance-park-title',
    'define-ambulance-park-desc',
    TimeSliceDuration,
    false,
    LOCATION_ENUM.ambulancePark,
    'ambulance',
    undefined,
    [SimFlag.AMBULANCE_PARK_BUILT],
    undefined,
    getAmbulanceChoices()
  );

  const helicopterParkChoice = new ParkChoiceTemplate(
    'define-helicopter-park-uid-dfg',
    'define-helicopter-park-title',
    'define-helicopter-park-desc',
    TimeSliceDuration,
    false,
    LOCATION_ENUM.helicopterPark,
    'ambulance',
    undefined,
    [SimFlag.HELICOPTER_PARK_BUILT],
    undefined,
    getHelicopterChoices()
  );

  const nestChoice = new MapChoiceActionTemplate(
    'define-Nest-uid-fgh',
    'define-Nest-title',
    'define-Nest-desc',
    TimeSliceDuration,
    false,
    undefined,
    undefined,
    undefined,
    getNestChoices(),
    LOCATION_ENUM.nidDeBlesses
  );

  const accessRegressChoice = new MapChoiceActionTemplate(
    'define-accreg-uid-ghj',
    'define-accreg-title',
    'define-accreg-desc',
    TimeSliceDuration,
    false,
    undefined,
    undefined,
    undefined,
    getAccregChoices(),
    LOCATION_ENUM.AccReg
  );

  const pmaChoice = new MapChoiceActionTemplate(
    'define-PMA-uid-hjk',
    'define-PMA-title',
    'define-PMA-desc',
    TimeSliceDuration,
    false,
    undefined,
    [SimFlag.PMA_BUILT],
    undefined,
    getPMAChoices(),
    LOCATION_ENUM.PMA
  );

  const pcChoice = new PCChoiceTemplate(
    'define-PC-uid-jkl',
    'define-PC-title',
    'define-PC-desc',
    TimeSliceDuration * 2,
    false,
    undefined,
    [SimFlag.PC_BUILT],
    undefined,
    getPCChoices()
  );
*/
  const openPMA = new DisplayMessageActionTemplate(
    'open-PMA-uid-yxc',
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
    'define-acsMcsArrival-uid-xcv',
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
    'define-evasanArrival-uid-cvb',
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
    'define-leadpmaArrival-uid-vbn',
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
    'activate-radio-schema-uid-bnm',
    'activate-radio-schema-title',
    'activate-radio-schema-desc',
    TimeSliceDuration,
    'activate-radio-schema-request',
    'activate-radio-schema-reply-ok',
    'activate-radio-schema-reply-unauthorized',
    RadioType.CASU,
    true
  );

  const appointEVASAN = new AppointActorActionTemplate(
    'appoint-EVASAN-uid-qay',
    'appoint-EVASAN-title',
    'appoint-EVASAN-desc',
    TimeSliceDuration,
    true,
    'appoint-EVASAN-no-resource-feedback',
    'appoint-refusal-feedback',
    'EVASAN',
    ['ambulancier'],
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.EVASAN_ARRIVED]
  );

  const appointLeadPMA = new AppointActorActionTemplate(
    'appoint-LeadPMA-uid-wsx',
    'appoint-LeadPMA-title',
    'appoint-LeadPMA-desc',
    TimeSliceDuration,
    true,
    'appoint-LeadPMA-no-resource-feedback',
    'appoint-refusal-feedback',
    'LEADPMA',
    ['infirmier', 'ambulancier'],
    [SimFlag.PMA_BUILT, SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.LEADPMA_ARRIVED]
  );

  const allocateResources = new MoveResourcesAssignTaskActionTemplate(
    'move-res-task-uid-edc',
    'move-res-task-title',
    'move-res-task-desc',
    TimeSliceDuration,
    true
  );

  const evacuate = new EvacuationActionTemplate(
    'evacuate-uid-rfv',
    'evacuate-title',
    'evacuate-desc',
    TimeSliceDuration,
    'evacuate-task-request',
    'evacuate-feedback-return',
    'evacuate-task-abort',
    'evacuate-task-refused',
    true
  );

  const pretriageReport = new PretriageReportTemplate(
    'pretriage-report-task-uid-tgb',
    'pretriage-report-task-title',
    'pretriage-report-task-desc',
    TimeSliceDuration,
    'pretriage-report-task-feedback-started',
    'pretriage-report-task-feedback-report',
    true
  );

  const situationUpdate = new SituationUpdateActionTemplate(
    'situation-update-uid-zhn',
    'situation-update-title',
    'situation-update-desc'
  );

  const templates: Record<ActionTemplateUid, ActionTemplateBase> = {};
  templates[moveActor.uid] = moveActor;
  templates[openPMA.uid] = openPMA;
  templates[acsMcsArrivalAnnouncement.uid] = acsMcsArrivalAnnouncement;
  templates[evasanArrivalAnnouncement.uid] = evasanArrivalAnnouncement;
  templates[leadpmaArrivalAnnouncement.uid] = leadpmaArrivalAnnouncement;
  templates[activateRadioSchema.uid] = activateRadioSchema;
  templates[casuMessage.uid] = casuMessage;
  templates[actorFreeRadioMessage.uid] = actorFreeRadioMessage;
  templates[casuFreeRadioMessage.uid] = casuFreeRadioMessage;
  templates[appointEVASAN.uid] = appointEVASAN;
  templates[appointLeadPMA.uid] = appointLeadPMA;
  templates[allocateResources.uid] = allocateResources;
  templates[evacuate.uid] = evacuate;
  templates[pretriageReport.uid] = pretriageReport;
  templates[situationUpdate.uid] = situationUpdate;

  // Beware that the order of the actions of the standard list depends on the creation order

  return {
    actionTemplates: templates,
    uniqueActionTemplates: {
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
