import { RadioType } from '../radio/communicationType';
import { ActorId, GlobalEventId, PatientUnitId, SimTime, TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { TaskStatus, TaskType } from '../tasks/taskBase';
import { getTaskByTypeAndLocation, getTaskCurrentStatus } from '../simulationState/taskStateAccess';
import { getLocalEventManager } from './localEventManager';
import { AddRadioMessageLocalEvent } from './localEventBaseRadio';
import { getTranslation } from '../../../tools/translation';
import { formatStandardPretriageReport } from '../patients/pretriageUtils';
import { HospitalRequestPayload } from '../events/casuMessageEvent';
import {
  getCachedHospitalsByProximity,
  getCachedPatientUnitById,
  getCachedPatientUnitIdsSorted,
} from '../../loaders/hospitalLoader';
import { updateHospitalProximityRequest } from '../simulationState/hospitalState';
import { getCasuActorId } from '../actors/actorLogic';
import { LocalEventBase, SourceType } from './localEventBase';

export class HospitalRequestUpdateLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly senderId: ActorId | undefined;
      readonly hospitalRequestPayload: HospitalRequestPayload;
    },
  ) {
    super({ ...props, type: 'HospitalRequestUpdateLocalEvent' });
  }

  private formatHospitalResponse(message: HospitalRequestPayload): string {
    const hospitals = Object.values(getCachedHospitalsByProximity(message.proximity));
    const units: PatientUnitId[] = getCachedPatientUnitIdsSorted();

    let casuMessage = '';
    let qty = 0;
    for (const hospital of hospitals) {
      casuMessage += `${hospital.shortName}: \n`;

      for (const unitId of units) {
        qty = hospital.units[unitId] ?? 0;
        if (qty > 0) {
          casuMessage += `${qty} ${I18n.translate(getCachedPatientUnitById(unitId).name)} \n`;
        }
      }

      casuMessage += '\n';
    }
    return casuMessage;
  }

  applyStateUpdate(state: MainSimulationState): void {
    updateHospitalProximityRequest(state, this.props.hospitalRequestPayload.proximity);
    const evt = new AddRadioMessageLocalEvent({
      parentEventId: this.props.parentEventId,
      source: this.props.source,
      simTimeStamp: this.props.simTimeStamp,
      senderId: getCasuActorId(),
      recipientId: this.props.senderId,
      message: this.formatHospitalResponse(this.props.hospitalRequestPayload),
      channel: RadioType.CASU,
      omitTranslation: true,
    });
    getLocalEventManager().queueLocalEvent(evt);
  }
}

/*
Pretriage Report calculations and radio response
*/
export class PretriageReportResponseLocalEvent extends LocalEventBase {
  private channel: RadioType = RadioType.RESOURCES;

  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly senderName: string;
      readonly recipient: number;
      readonly pretriageLocation: LOCATION_ENUM;
      readonly feedbackWhenReport: TranslationKey;
    },
  ) {
    super({ ...props, type: 'PretriageReportResponseLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const taskStatus: TaskStatus = getTaskCurrentStatus(
      state,
      getTaskByTypeAndLocation(state, TaskType.Pretriage, this.props.pretriageLocation).Uid,
    );

    getLocalEventManager().queueLocalEvent(
      new AddRadioMessageLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: this.props.simTimeStamp,
        senderName: this.props.senderName,
        recipientId: this.props.recipient,
        message:
          taskStatus === 'Uninitialized'
            ? getTranslation('mainSim-actions-tasks', 'pretriage-task-notStarted', true, [
              getTranslation('mainSim-locations', 'location-' + this.props.pretriageLocation),
            ])
            : formatStandardPretriageReport(
              state,
              this.props.pretriageLocation,
              this.props.feedbackWhenReport,
              false,
              true,
            ),
        channel: this.channel,
        omitTranslation: true,
      }),
    );
  }
}