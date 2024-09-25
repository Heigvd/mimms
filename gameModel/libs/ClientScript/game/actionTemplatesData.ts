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
  SelectionFixedMapEntityTemplate,
  SelectionParkTemplate,
  SelectionPCFrontTemplate,
  SelectionPCTemplate,
  SendRadioMessageTemplate,
  SimFlag,
} from './common/actions/actionTemplateBase';
import { TimeSliceDuration } from "./common/constants";
import { BuildingStatus, GeometryBasedFixedMapEntity, MultiLineStringGeometricalShape, PointGeometricalShape, PolygonGeometricalShape } from "./common/events/defineMapObjectEvent";
import { LOCATION_ENUM } from "./common/simulationState/locationState";
import { ActionType } from "./common/actionType";


export interface IUniqueActionTemplates {

  readonly SelectionPCFrontTemplate: SelectionPCFrontTemplate;
  readonly SelectionPCSanTemplate : SelectionPCTemplate,
  readonly MoveActorActionTemplate: MoveActorActionTemplate,
  readonly AcsMcsArrivalAnnouncement: DisplayMessageActionTemplate,
  readonly OpenPmaActionTemplate: DisplayMessageActionTemplate,
  readonly CasuMessageTemplate: CasuMessageTemplate,
  readonly ActivateRadioSchemaActionTemplate: ActivateRadioSchemaActionTemplate,
  readonly MoveResourcesAssignTaskActionTemplate: MoveResourcesAssignTaskActionTemplate,
  readonly PretriageReportTemplate: PretriageReportTemplate,
  readonly EvacuationActionTemplate: EvacuationActionTemplate,
  readonly ActorSendRadioMessageTemplate : SendRadioMessageTemplate,
  readonly CasuSendRadioMessageTemplate : SendRadioMessageTemplate
}

export function initActionTemplates(): {
  actionTemplates :Record<string, ActionTemplateBase>, 
  uniqueActionTemplates : IUniqueActionTemplates} 
  {
  // TODO read from Variable
  // TODO the message might depend on the state, it might a function(state) rather than translation key
  const placePCFront = new SelectionPCFrontTemplate(
    'define-pcFront-title',
    'define-pcFront-desc',
    TimeSliceDuration,
    'define-pcFront-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-pcFront',
      LOCATION_ENUM.pcFront,
      ['AL'],
      new PointGeometricalShape([
        [2500075.549931927, 1118500.103111194],
        [2500106.549931926, 1118550.103111192],
        [2500106.549931926, 1118489.103111192],
      ]),
      BuildingStatus.selection,
      'pcFront' /*_blue*/
    ),
    false,
    [],
    [SimFlag.PCFRONT_BUILT]
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
    ActionType.ACTORS_RADIO,
    true,
    ActionType.ACTORS_RADIO
  );

  const casuFreeRadioMessage = new SendRadioMessageTemplate(
    'send-radio-title',
    'send-radio-desc',
    TimeSliceDuration,
    'send-radio-feedback',
    ActionType.CASU_RADIO,
    true,
    ActionType.CASU_RADIO
  );

  const moveActor = new MoveActorActionTemplate(
    'move-actor-title',
    'move-actor-desc',
    TimeSliceDuration,
    'move-actor-feedback'
  );

  const placeAccessRegress = new SelectionFixedMapEntityTemplate(
    'define-accreg-title',
    'define-accreg-desc',
    TimeSliceDuration * 3,
    'define-accreg-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'Accreg',
      LOCATION_ENUM.AccReg,
      [],
      new MultiLineStringGeometricalShape([
        [
          [
            [2500052.6133020874, 1118449.2968644362],
            [2500087.3369474486, 1118503.6293053096],
          ],
          [
            [2500060.952470149, 1118523.9098080816],
            [2500029.950508212, 1118486.1465293542],
          ],
        ],
        [
          [
            [2500113.647301364, 1118575.704815885],
            [2500096.7293570912, 1118534.8226090078],
          ],
          [
            [2500060.952470149, 1118523.9098080816],
            [2500029.950508212, 1118486.1465293542],
          ],
        ],
        [
          [
            [2500040.187860512, 1118562.59843714],
            [2500065.949428312, 1118543.3339090333],
          ],
          [
            [2500109.5966483564, 1118490.3921636103],
            [2500134.8148273816, 1118469.6649961546],
          ],
        ],
      ]),
      BuildingStatus.selection,
      'right-arrow',
      {
        Actors: false,
        Resources: false,
        Patients: false,
      }
    )
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
    ActionType.CASU_RADIO,
    true
  );

  const appointEVASAN = new AppointActorActionTemplate(
    'appoint-EVASAN-title',
    'appoint-EVASAN-desc',
    TimeSliceDuration,
    'appoint-EVASAN-feedback',
    true,
    'appoint-EVASAN-no-resource-feedback',
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
    'LEADPMA',
    ['infirmier', 'ambulancier'],
    [SimFlag.PMA_BUILT, SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED],
    [SimFlag.LEADPMA_ARRIVED]
  );

  const placePMA = new SelectionFixedMapEntityTemplate(
    'define-PMA-title',
    'define-PMA-desc',
    TimeSliceDuration * 4,
    'define-PMA-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-pma-short',
      LOCATION_ENUM.PMA,
      ['LEADPMA'],
      new PolygonGeometricalShape([
        [
          [
            [2499959.513377705, 1118456.6791527744], //'way/301355984'
            [2499948.345528039, 1118442.755145481],
            [2499928.9775556503, 1118418.871686022],
            [2499947.162274424, 1118404.3729329833],
            [2499992.1599490084, 1118459.7301378376],
            [2500013.795503398, 1118486.3335680368],
            [2500019.9726727167, 1118493.9362230333],
            [2500057.0664169285, 1118539.5628896698],
            [2500046.3844424966, 1118547.5332560872],
            [2500038.334720112, 1118553.6478721495],
            [2500031.238813536, 1118545.0931211817],
            [2500012.837898292, 1118522.2385113093],
            [2499959.513377705, 1118456.6791527744],
          ],
        ],
        [
          [
            [2500109.999851025, 1118456.3699052047], //'way/82683752'
            [2500113.781500128, 1118461.010360654],
            [2500121.785907592, 1118470.828775529],
            [2500114.0474236254, 1118477.104916978],
            [2500105.0520694936, 1118484.3913443699],
            [2500096.448885649, 1118473.8379365443],
            [2500093.2659977684, 1118469.932506736],
            [2500109.999851025, 1118456.3699052047],
          ],
        ], //'way/179543646'
        [
          [
            [2500136.790143822, 1118548.3406066815],
            [2500141.6760064885, 1118560.489763118],
            [2500143.4792181817, 1118564.9850271842],
            [2500124.888196066, 1118572.1742195904],
            [2500121.81913271, 1118564.4089291636],
            [2500118.355243353, 1118555.6384201094],
            [2500133.0180577287, 1118549.8816207554],
            [2500136.790143822, 1118548.3406066815],
          ],
        ],
      ]),
      BuildingStatus.selection,
      'PMA'
    ),
    false,
    undefined,
    [SimFlag.PMA_BUILT]
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
    ActionType.RESOURCES_RADIO,
    true
  );

  const placePC = new SelectionPCTemplate(
    'define-PC-title',
    'define-PC-desc',
    TimeSliceDuration * 2,
    'define-PC-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-pc-short',
      LOCATION_ENUM.PC,
      ['ACS', 'MCS'],
      new PointGeometricalShape([
        [2500095.549931929, 1118489.103111194],
        [2500009.75586577, 1118472.531405577],
        [2500057.0688582086, 1118551.6205987816],
      ]),
      BuildingStatus.selection,
      'PC'
    ),
    false,
    [SimFlag.PCS_ARRIVED],
    [SimFlag.PC_BUILT]
  );

  const placeNest = new SelectionFixedMapEntityTemplate(
    'define-Nest-title',
    'define-Nest-desc',
    TimeSliceDuration * 3,
    'define-Nest-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-niddeblesses',
      LOCATION_ENUM.nidDeBlesses,
      [],
      new PointGeometricalShape([
        [2500041.9170648125, 1118456.4054969894],
        [2500106.9001576486, 1118532.2446804282],
        [2499999.6045754217, 1118483.805125067],
      ]),
      BuildingStatus.selection,
      'Nest'
    )
  );

  const placeAmbulancePark = new SelectionParkTemplate(
    'define-ambulance-park-title',
    'define-ambulance-park-desc',
    TimeSliceDuration,
    'define-ambulance-park-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-ambulancePark',
      LOCATION_ENUM.ambulancePark,
      ['EVASAN'],
      new PointGeometricalShape([
        [2499960, 1118580],
        [2500070, 1118498],
        [2499961, 1118388],
      ]),
      BuildingStatus.selection,
      'ambulance-park',
      {
        Actors: false,
        Resources: true,
        Patients: true,
      }
    ),
    'ambulance',
    false,
    undefined,
    [SimFlag.AMBULANCE_PARK_BUILT]
  );

  const placeHelicopterPark = new SelectionParkTemplate(
    'define-helicopter-park-title',
    'define-helicopter-park-desc',
    TimeSliceDuration * 2,
    'define-helicopter-park-feedback',
    new GeometryBasedFixedMapEntity(
      0,
      'location-helicopterPark',
      LOCATION_ENUM.helicopterPark,
      ['EVASAN'],
      new PointGeometricalShape([
        [2499956, 1118332],
        [2499872, 1118614],
        [2499925, 1118451],
      ]),
      BuildingStatus.selection,
      'helicopter-park',
      {
        Actors: false,
        Resources: true,
        Patients: true,
      }
    ),
    'helicopter',
    false,
    undefined,
    [SimFlag.HELICOPTER_PARK_BUILT]
  );

  const activateRadioSchema = new ActivateRadioSchemaActionTemplate(
    'activate-radio-schema-title',
    'activate-radio-schema-desc',
    TimeSliceDuration,
    'activate-radio-schema-feedback',
    'activate-radio-schema-request',
    'activate-radio-schema-reply-ok',
    'activate-radio-schema-reply-unauthorized',
    ActionType.CASU_RADIO,
    true
  );

  const allocateResources = new MoveResourcesAssignTaskActionTemplate(
    'move-res-task-title',
    'move-res-task-desc',
    TimeSliceDuration,
    'move-res-task-feedback',
    'move-res-task-refused',
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

  const evacuate = new EvacuationActionTemplate(
    'evacuate-title',
    'evacuate-desc',
    TimeSliceDuration,
    'evacuate-feedback',
    'evacuate-task-started',
    'evacuate-feedback-return',
    'evacuate-task-abort',
    true
  );

  const templates: Record<string, ActionTemplateBase> = {};
  templates[placePCFront.Uid] = placePCFront;
  templates[moveActor.Uid] = moveActor;
  templates[getInfo.Uid] = getInfo;
  templates[getInfo2.Uid] = getInfo2;
  templates[getPoliceInfos.Uid] = getPoliceInfos;
  templates[getFireFighterInfos.Uid] = getFireFighterInfos;
  templates[placePMA.Uid] = placePMA;
  templates[placePC.Uid] = placePC;
  templates[placeNest.Uid] = placeNest;
  templates[placeAccessRegress.Uid] = placeAccessRegress;
  templates[placeAmbulancePark.Uid] = placeAmbulancePark;
  templates[placeHelicopterPark.Uid] = placeHelicopterPark;
  templates[openPMA.Uid] = openPMA;
  templates[acsMcsArrivalAnnouncement.Uid] = acsMcsArrivalAnnouncement;
  templates[activateRadioSchema.Uid] = activateRadioSchema;
  templates[casuMessage.Uid] = casuMessage;
  templates[actorFreeRadioMessage.Uid] = actorFreeRadioMessage;
  templates[casuFreeRadioMessage.Uid] = casuFreeRadioMessage;
  templates[appointEVASAN.Uid] = appointEVASAN;
  templates[appointLeadPMA.Uid] = appointLeadPMA;
  templates[allocateResources.Uid] = allocateResources;
  templates[evacuate.Uid] = evacuate;
  templates[pretriageReport.Uid] = pretriageReport;

  return {
    actionTemplates : templates, 
    uniqueActionTemplates : {
      SelectionPCFrontTemplate : placePCFront,
      SelectionPCSanTemplate: placePC,
      MoveActorActionTemplate: moveActor,
      AcsMcsArrivalAnnouncement: acsMcsArrivalAnnouncement,
      OpenPmaActionTemplate: openPMA,
      CasuMessageTemplate: casuMessage,
      ActivateRadioSchemaActionTemplate: activateRadioSchema,
      MoveResourcesAssignTaskActionTemplate : allocateResources,
      PretriageReportTemplate : pretriageReport,
      EvacuationActionTemplate: evacuate,
      ActorSendRadioMessageTemplate: actorFreeRadioMessage,
      CasuSendRadioMessageTemplate: casuFreeRadioMessage
    }
  };

}
