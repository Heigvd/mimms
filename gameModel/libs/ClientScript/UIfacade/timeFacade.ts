import { triggerTimeForward } from "../game/mainSimulationLogic";

/**
 * Triggers time forward in simulation
 */
export async function timeForward() : Promise<IManagedResponse>{
  return await triggerTimeForward();
}
