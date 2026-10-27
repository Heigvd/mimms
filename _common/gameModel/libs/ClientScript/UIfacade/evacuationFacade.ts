import { HospitalId, PatientId, PatientUnitId } from '../game/common/baseTypes';
import { buildAvailableSquads, EvacuationSquad } from '../game/common/evacuation/evacuationLogic';
import {
  EvacuationSquadDefinition,
  EvacuationSquadType,
  getAllSquadDefinitions,
  getNumberDriverNeeded,
  getNumberHealersNeeded,
} from '../game/common/evacuation/evacuationSquadDef';
import { EvacuationActionPayload } from '../game/common/events/evacuationMessageEvent';
import { runActionButton } from '../gameInterface/actionsButtonLogic';
import { setInterfaceState } from '../gameInterface/interfaceState';
import { uniqueActionTemplates } from '../UIfacade/actionFacade';

// used in radioChannelEvacuation page

export function toggleEvacuationModal(show: boolean): void {
  setInterfaceState({ showEvacuationModal: show });
}

// Data choices

export function getEvacSquadDefinitions(): EvacuationSquadDefinition[] {
  return getAllSquadDefinitions();
}

export function getVehicleIcon(evacSquadDef: EvacuationSquadDefinition): string {
  return evacSquadDef.vehicleIcon;
}

// -------------------------------------------------------------------------------------------------
// evacuation selection state (used in page evacuationView)
// -------------------------------------------------------------------------------------------------

export interface EvacuationSelectionState {
  selectedPatientId: PatientId | undefined;
  selectedHospitalId: HospitalId | undefined;
  selectedServiceId: PatientUnitId | undefined;
  selectedSquad: EvacuationSquad | undefined;
}

export function getInitialEvacuationSelectionState(): EvacuationSelectionState {
  return {
    selectedPatientId: undefined,
    selectedHospitalId: undefined,
    selectedServiceId: undefined,
    selectedSquad: undefined,
  };
}

/**
 * @param update, an object that only contains the change set to be applied to the evacuation selection state
 */
export function setEvacuationSelectionState(update: Partial<EvacuationSelectionState>): void {
  const newState = Helpers.cloneDeep(Context.evacuationState.state);
  Object.assign(newState, update);
  Context.evacuationState.setState(newState);
}

/**
 * For convenience
 * Just casting the evacuation selection state properly
 */
export function getTypedEvacuationSelectionState(): EvacuationSelectionState {
  return Context.evacuationState?.state;
}

export function resetEvacuationState(): void {
  setEvacuationSelectionState(getTypedEvacuationSelectionState());
}

export function sendEvacuationOrder(): void {
  if (canSendEvacuationOrder()) {
    const template = uniqueActionTemplates()?.EvacuationActionTemplate;
    runActionButton(template);
    resetEvacuationState();
    toggleEvacuationModal(false);
  }
}

export function canSendEvacuationOrder(): boolean {
  const selection = getTypedEvacuationSelectionState();
  return (
    selection.selectedHospitalId !== undefined &&
    selection.selectedServiceId !== undefined &&
    selection.selectedPatientId !== undefined &&
    isComplete(selection.selectedSquad)
  );
}

/**
 *
 * @returns the selected patient hospital and squad, undefined if missing some selection
 */
export function getEvacuationOrderPayload(): EvacuationActionPayload | undefined {
  const selection = getTypedEvacuationSelectionState();
  if (canSendEvacuationOrder()) {
    const squad = selection.selectedSquad!;
    return {
      patientId: selection.selectedPatientId!,
      hospitalId: selection.selectedHospitalId!,
      patientUnitId: selection.selectedPatientId!,
      squad: {
        type: squad.type,
        vehicle: squad.vehicle.Uid,
        drivers: squad.drivers.map(d => d.Uid),
        healers: squad.healers.map(d => d.Uid),
      },
    };
  }
}

export function getAvailableSquadsList(squadType: EvacuationSquadType): EvacuationSquad[] {
  return buildAvailableSquads(squadType);
}

export function hasDrivers(formedSquad: EvacuationSquad): boolean {
  return formedSquad?.drivers.length === getNumberDriverNeeded(formedSquad?.type);
}

export function hasHealers(formedSquad: EvacuationSquad): boolean {
  return formedSquad?.healers.length === getNumberHealersNeeded(formedSquad?.type);
}

export function isComplete(formedSquad: EvacuationSquad | undefined): boolean {
  return formedSquad?.vehicle !== undefined && hasDrivers(formedSquad) && hasHealers(formedSquad);
}
