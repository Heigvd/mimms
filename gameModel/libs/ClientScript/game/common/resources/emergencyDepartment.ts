import { entries } from "../../../tools/helper";
import { InterventionRole } from "../actors/actor";
import { ActorId, GlobalEventId, TranslationKey } from "../baseTypes";
import { ResourceMobilizationEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { buildContainerDefinition, ResourceContainerConfig, ResourceContainerDefinition, ResourceContainerDefinitionId, ResourceContainerType } from "./resourceContainer";
import { ResourceType } from "./resourceType";

const containerDefinitions : Record<ResourceContainerDefinitionId, ResourceContainerDefinition> = {};

export function getContainerDef(id: ResourceContainerDefinitionId){
	return containerDefinitions[id];
}

export function getAllContainerDefs() : Record<ResourceContainerDefinitionId, ResourceContainerDefinition> {
	return containerDefinitions;
}

export function loadEmergencyResourceContainers(): ResourceContainerConfig[] {

	const containerConfigs = [];
	// TODO read static variable from scenario containing container definitions
	const emergencyAmbulance = addContainerDefinition(
		'Ambulance',
		"emergencyAmbulance",
		{ 'ambulance': 1, 'ambulancier': 2}
	);

	const intermediateAmbulance = addContainerDefinition(
		'Ambulance',
		"intermediateAmbulance",
		{technicienAmbulancier: 1, ambulancier: 1, ambulance: 1},
	);

	const acs = addContainerDefinition('ACS', 'acs', {}, ['ACS']);
	const mcs = addContainerDefinition('MCS', 'mcs', {}, ['MCS']);


	// TODO read static variable containing containers availability

	const acsConfig : ResourceContainerConfig = {
		amount:1,
		availabilityTime:0,
		templateId: acs,
		travelTime: 5 * 60
	}
	containerConfigs.push(acsConfig);

	const mcsConfig : ResourceContainerConfig = {
		amount:1,
		availabilityTime:0,
		templateId: mcs,
		travelTime: 7 * 60
	}
	containerConfigs.push(mcsConfig);

	const closeAmbulances : ResourceContainerConfig = {
		amount:2,
		availabilityTime: 0,
		templateId : emergencyAmbulance,
		travelTime : 2*60
	}
	containerConfigs.push(closeAmbulances);

	const farAmbulances : ResourceContainerConfig = {
		amount:2,
		availabilityTime: 5*60,
		templateId : intermediateAmbulance,
		travelTime : 3*60
	}

	containerConfigs.push(farAmbulances);

	return containerConfigs;
}

function addContainerDefinition (
	type: ResourceContainerType,
	name: TranslationKey,
	resources: Partial<Record<ResourceType, number>>, 
	roles: InterventionRole[] = [],
): ResourceContainerDefinitionId 
{
	const c = buildContainerDefinition(type, name, resources, roles);
	containerDefinitions[c.uid] = c;
	return c.uid;
}

/**
 * This method changes the state, it should only be called during a state update
 * Resolve a resource request made by a player
 * fetch all the resources available and dispatch them
 * if the resource is not available right away it will be sent later but scheduled
 * @param the global event id that triggered this request
 * @param request the amount and type formulated in the request
 * @param author of the request
 * @param state the current state of the game
 */
export function resolveResourceRequest(globalEventId: GlobalEventId, 
	request :Record<ResourceContainerType, number>,
	senderId: ActorId,
	state :MainSimulationState) {

	const containers = state.getResourceContainersByType();
	const now = state.getSimTime();
	entries(request).filter(([_,a]) => a > 0).forEach(([typeId, requestedAmount]) =>  {
		// order by time of availability
		const cs = (containers[typeId] || []).filter(c => c.amount > 0).sort((c) => c.availabilityTime);
		let found = 0;
		for(let i = 0; i < cs.length && found < requestedAmount; i++){
			const c = cs[i];
			const n = Math.min(requestedAmount - found, c.amount);
			// n > 0 by construction
			found += n;
			c.amount -= n;// STATE CHANGE HERE
			
			const departureTime = Math.max(c.availabilityTime, now);
			const definition = getContainerDef(c.templateId);
			const evt = new ResourceMobilizationEvent(globalEventId, now, senderId, departureTime, c.travelTime, definition.uid, n);
			wlog('MOB EVENT *********** ', evt);
			localEventManager.queueLocalEvent(evt);
		}

	});
	

}
