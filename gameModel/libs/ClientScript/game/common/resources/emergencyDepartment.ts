import { entries } from "../../../tools/helper";
import { InterventionRole } from "../actors/actor";
import { GlobalEventId, TranslationKey } from "../baseTypes";
import { IncomingResourcesLocalEvent, ResourcesArrivalLocalEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { buildContainerDefinition, ResourceContainerConfig, ResourceContainerDefinition, ResourceContainerDefinitionId } from "./resourceContainer";
import { ResourceType } from "./resourceType";

const containerDefinitions : Record<ResourceContainerDefinitionId, ResourceContainerDefinition> = {};

export function getContainerDef(id: ResourceContainerDefinitionId){
	return containerDefinitions[id];
}

export function loadEmergencyResourceContainers(): ResourceContainerConfig[] {

	const containerConfigs = [];
	// TODO read static variable from scenario containing container definitions
	const emergencyAmbulance = addContainerDefinition("emergencyAmbulance",
		{ 'ambulance': 1, 'ambulancier': 2},[]
	);

	const intermediateAmbulance = addContainerDefinition(
		"intermediateAmbulance",
		{technicienAmbulancier: 1, ambulancier: 1, ambulance: 1},
	);

	const acs = addContainerDefinition('acs', {}, ['ACS']);
	const mcs = addContainerDefinition('mcs', {}, ['MCS']);


	// TODO read static variable containing containers availability

	const acsConfig : ResourceContainerConfig = {
		amount:1,
		availabilityTime:0,
		templateId: acs,
		travelTime: 5* 60
	}
	containerConfigs.push(acsConfig);

	const mcsConfig : ResourceContainerConfig = {
		amount:1,
		availabilityTime:0,
		templateId: mcs,
		travelTime: 5* 60
	}
	containerConfigs.push(mcsConfig);

	const closeAmbulances : ResourceContainerConfig = {
		amount:2,
		availabilityTime: 0,
		templateId : emergencyAmbulance,
		travelTime : 5*60
	}
	containerConfigs.push(closeAmbulances);

	const farAmbulances : ResourceContainerConfig = {
		amount:2,
		availabilityTime: 5*60,
		templateId : intermediateAmbulance,
		travelTime : 15*60
	}

	containerConfigs.push(farAmbulances);

	return containerConfigs;
}

function addContainerDefinition (name: TranslationKey, 
	resources: Partial<Record<ResourceType, number>>, 
	roles: InterventionRole[] = []
): ResourceContainerDefinitionId 
{
	const c = buildContainerDefinition(name, resources, roles);
	containerDefinitions[c.uid] = c;
	return c.uid;
}

/**
 * Resolve a resource request made by a player
 * fetch all the resources available and dispatch them
 * @param request the amount and type formulated in the request
 * @param state the current state of the game
 */
export function resolveRequest(globalEventId: GlobalEventId, 
	request :Record<ResourceContainerDefinitionId, number>, 
	state :MainSimulationState) {

	//const sentContainers : ResourcesArrivalLocalEvent[] = [];
	const containers = state.getResourceContainersByDefId();
	const now = state.getSimTime();
	entries(request).filter(([_,a]) => a > 0).forEach(([defId, requestedAmount]) =>  {
		// get currently available containers
		const cs = containers[defId]//.filter(c => c.availabilityTime <= state.getSimTime());
		// take them by order of time availability
		cs.sort((c) => c.availabilityTime);
		let found = 0;
		for(let i = 0; i < cs.length && found < requestedAmount; i++){
			const c = cs[i];
			const n = Math.min(requestedAmount, c.amount);

			found += n;
			// STATE CHANGE HERE could be done in the emitted events directly ?
			c.amount -= n;
			
			const arrivalTime = Math.max(c.availabilityTime, now) + c.travelTime;
			
			localEventManager.queueLocalEvent(new ResourcesArrivalLocalEvent(globalEventId, arrivalTime, defId, n))

		}

	})
	

}
