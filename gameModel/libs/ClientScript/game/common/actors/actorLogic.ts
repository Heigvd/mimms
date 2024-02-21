import { ActorId } from "../baseTypes";
import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { InterventionRole } from "./actor";

export function getStateActorSymbolicLocation(state: Readonly<MainSimulationState>, role: InterventionRole): LOCATION_ENUM {

	// there should only be one
    return state.getInternalStateObject().actors.filter(actor => actor.Role === role)[0].getComputedSymbolicLocation();
}

export function getStateActorSymbolicLocationForActor(state: Readonly<MainSimulationState>, actorId: ActorId): LOCATION_ENUM {

	// there should only be one
    return state.getInternalStateObject().actors.filter(actor => actor.Uid === actorId)[0].getComputedSymbolicLocation();
}