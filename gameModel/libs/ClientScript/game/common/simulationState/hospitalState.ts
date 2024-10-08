import { HospitalProximity } from '../evacuation/hospitalType';
import { MainSimulationState } from './mainSimulationState';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// types
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

export interface HospitalState {
  proximityWidestRequest?: HospitalProximity;
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
// update data
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------

/**
 * Change the proximity request
 */
export function updateHospitalProximityRequest(
  state: MainSimulationState,
  proximity: HospitalProximity
): void {
  const internalState = state.getInternalStateObject();
  // we keep the widest proximity asked
  if (
    internalState.hospital.proximityWidestRequest === undefined ||
    proximity.valueOf() > internalState.hospital.proximityWidestRequest.valueOf()
  ) {
    internalState.hospital.proximityWidestRequest = proximity;
  }
}

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
