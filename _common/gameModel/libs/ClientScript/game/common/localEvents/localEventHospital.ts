import { RadioType } from '../radio/communicationType';
import { ActorId, GlobalEventId, PatientUnitId, SimTime } from '../baseTypes';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getLocalEventManager } from './localEventManager';
import { AddRadioMessageLocalEvent } from './localEventRadio';
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
    }
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
