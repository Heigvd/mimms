/**
 * All UX interactions related to resources should live here
 * if any signature is modified make sure to report it in all page scripts
 * put minimal logic in here
 */

import { ActorId } from "../game/common/baseTypes";
import { countAvailableResources } from "../game/mainSimulationLogic";

/**
 * Retrieve how many resources of medical staff are available
 *
 * @param actorId The actor responsible of these resources
 */
export function countAvailableMedicalStaff(actorId: ActorId): number {
  return countAvailableResources(actorId, 'MEDICAL_STAFF');
}

/**
 * Retrieve how many ambulances are available
 *
 * @param actorId The actor responsible of these resources
 */
export function countAvailableAmbulances(actorId: ActorId): number {
  return countAvailableResources(actorId, 'AMBULANCE');
}

/**
 * Retrieve how many helicopters are available
 *
 * @param actorId The actor responsible of these resources
 */
export function countAvailableHelicopters(actorId: ActorId): number {
  return countAvailableResources(actorId, 'HELICOPTER');
}
