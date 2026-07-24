import {
  ActionTemplateBase,
  SimFlag,
} from './common/actions/actionTemplate/actionTemplateBase';
import { ActionType } from './common/actionType';
import { ActionTemplateUid } from './common/baseTypes';
import { TimeSliceDuration } from './common/constants';
import { RadioType } from './common/radio/communicationType';
import { ActionTemplateData } from './loaders/actionTemplateLoader';
import {
  ActivateRadioSchemaActionTemplate,
  CasuMessageTemplate,
  DisplayMessageActionTemplate,
  PretriageReportTemplate,
  SendRadioMessageTemplate,
} from './common/actions/actionTemplate/radioTemplates';
import {
  AppointActorActionTemplate,
  MoveActorActionTemplate,
  SituationUpdateActionTemplate,
} from './common/actions/actionTemplate/actorTemplates';
import {
  EvacuationActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
} from './common/actions/actionTemplate/patientResourceTemplates';

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
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  // TODO those instances will be created from the templates descriptor data through the actionTemplateFactory

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
    0,
    ActionType.ACTORS_RADIO
  );

  const casuFreeRadioMessage = new SendRadioMessageTemplate(
    'send-radio-casu-uid-asd',
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    RadioType.CASU,
    0,
    ActionType.CASU_RADIO
  );

  const openPMA = new DisplayMessageActionTemplate(
    'open-PMA-uid-yxc',
    'open-PMA-title',
    'open-PMA-desc',
    TimeSliceDuration,
    'open-PMA-feedback',
    1,
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
    1,
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
    1,
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
    1,
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
    RadioType.CASU
  );

  const appointEVASAN = new AppointActorActionTemplate(
    'appoint-EVASAN-uid-qay',
    'appoint-EVASAN-title',
    'appoint-EVASAN-desc',
    TimeSliceDuration,
    'appoint-hierarchy-not-respected',
    'EVASAN',
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.EVASAN_ARRIVED]
  );

  const appointLeadPMA = new AppointActorActionTemplate(
    'appoint-LeadPMA-uid-wsx',
    'appoint-LeadPMA-title',
    'appoint-LeadPMA-desc',
    TimeSliceDuration,
    'appoint-hierarchy-not-respected',
    'LEADPMA',
    [SimFlag.PMA_BUILT, SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.LEADPMA_ARRIVED]
  );

  const allocateResources = new MoveResourcesAssignTaskActionTemplate(
    'move-res-task-uid-edc',
    'move-res-task-title',
    'move-res-task-desc',
    TimeSliceDuration
  );

  const evacuate = new EvacuationActionTemplate(
    'evacuate-uid-rfv',
    'evacuate-title',
    'evacuate-desc',
    TimeSliceDuration,
    'evacuate-task-request',
    'evacuate-feedback-return',
    'evacuate-task-abort',
    'evacuate-task-hierarchy-not-respected'
  );

  const pretriageReport = new PretriageReportTemplate(
    'pretriage-report-task-uid-tgb',
    'pretriage-report-task-title',
    'pretriage-report-task-desc',
    TimeSliceDuration,
    'pretriage-report-task-feedback-started',
    'pretriage-report-task-feedback-report'
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
