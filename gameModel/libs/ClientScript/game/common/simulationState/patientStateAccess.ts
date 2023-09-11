import { MainSimulationState } from "./mainSimulationState";
import { mainSimStateLogger } from "../../../tools/logger";

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// get read only data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export function countNbPatientsForPreTriage(state: Readonly<MainSimulationState>, zone: string): number {
  const internalState = state.getInternalStateObject();

  if (zone === "A") {
    return internalState.tmp.nbForPreTriZoneA;
  } else if (zone === "B") {
    return internalState.tmp.nbForPreTriZoneB;
  }

  return 0;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// change the world
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------


export function categorizeOnePatient(state: MainSimulationState, zone: string): void {
  mainSimStateLogger.debug("categorize 1 patient in zone " + zone);

  const internalState = state.getInternalStateObject();

  if (zone === "A") {
    internalState.tmp.nbForPreTriZoneA -= 1;
    mainSimStateLogger.debug("still " + internalState.tmp.nbForPreTriZoneA + " patients to categorize " + zone);

  } else if (zone === "B") {
    internalState.tmp.nbForPreTriZoneB -= 1;
    mainSimStateLogger.debug("still " + internalState.tmp.nbForPreTriZoneB + " patients to categorize " + zone);
  }
}
