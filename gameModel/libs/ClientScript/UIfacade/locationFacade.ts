import { FixedMapEntity } from '../game/common/events/defineMapObjectEvent';
import { getAvailableLocations } from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';

/**
 * Returns list of accessible map entities
 * @returns FixedMapEntity[]
 */
export function getAvailableLocationsFacade(): FixedMapEntity[] {
  return getAvailableLocations(getCurrentState());
}
