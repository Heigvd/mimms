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

		const containerConfigs: ResourceContainerConfig[] = [];
		const emergencyAmbulance = addContainerDefinition(
			'Ambulance',
			"emergencyAmbulance",
			{ 'ambulance': 1, 'ambulancier': 2}
		);

		const intermediateAmbulance = addContainerDefinition(
			'Ambulance',
			"intermediateAmbulance",
			{"technicienAmbulancier": 1, "ambulancier": 1, "ambulance": 1},
		);

		const transfertAmbulance = addContainerDefinition(
			'Ambulance',
			"transfertAmbulance",
			{ 'ambulance': 1, 'technicienAmbulancier': 1, "secouriste": 1 }
		);

		const helicopter = addContainerDefinition(
			'Helicopter',
			"helicopter",
			{ 'helicopter': 1, 'ambulancier': 1, "medecinSenior": 1 }
		);

		const smur = addContainerDefinition(
			'SMUR',
			"smur",
			{ 'ambulancier': 1, "medecinJunior": 1 }
		);

		const acsMcs = addContainerDefinition('ACS-MCS', 'acs', {}, ['ACS', 'MCS']);
		const pma = addContainerDefinition(
			'PMA',
			"pma",
			{ 'secouriste': 4 }
		);

		const pica = addContainerDefinition(
			'PICA',
			"pica",
			{ 'secouriste': 10 }
		);

		const pcSanitaire = addContainerDefinition(
			'PCS',
			"pcs",
			{ }
		);
		for (let i = 1; i <= 4; i++) {
			containerConfigs.push({
				amount: 1,
				name: `GE-00${i}`,
				availabilityTime: 0,
				templateId: emergencyAmbulance,
				travelTime: 5 * 60
			});
		}
		containerConfigs.push({
			amount: 1,
			name: `GE-006`,
			availabilityTime: 10 * 60,
			templateId: emergencyAmbulance,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `GE-007`,
			availabilityTime: 15 * 60,
			templateId: emergencyAmbulance,
			travelTime: 5 * 60
		});

		containerConfigs.push({
			amount: 1,
			name: `GE-010`,
			availabilityTime: 20 * 60,
			templateId: emergencyAmbulance,
			travelTime: 5 * 60
		});

		containerConfigs.push({
			amount: 1,
			name: `GE-014`,
			availabilityTime: 30 * 60,
			templateId: emergencyAmbulance,
			travelTime: 5 * 60
		});
		for (let i = 1; i <= 3; i++) {
			containerConfigs.push({
				amount: 1,
				name: `VD-00${i}`,
				availabilityTime: 15 * 60,
				templateId: emergencyAmbulance,
				travelTime: 30 * 60
			});
		}

		for (let i = 4; i <= 5; i++) {
			containerConfigs.push({
				amount: 1,
				name: `VD-00${i}`,
				availabilityTime: 30 * 60,
				templateId: emergencyAmbulance,
				travelTime: 30 * 60
			});
		}
		containerConfigs.push({
			amount: 1,
			name: `GE-005`,
			availabilityTime: 5 * 60,
			templateId: intermediateAmbulance,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `GE-008`,
			availabilityTime: 20 * 60,
			templateId: intermediateAmbulance,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `GE-012`,
			availabilityTime: 25 * 60,
			templateId: intermediateAmbulance,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `GE-013`,
			availabilityTime: 25 * 60,
			templateId: intermediateAmbulance,
			travelTime: 5 * 60
		});

		containerConfigs.push({
			amount: 1,
			name: `GE-009`,
			availabilityTime: 20 * 60,
			templateId: transfertAmbulance,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `GE-011`,
			availabilityTime: 25 * 60,
			templateId: transfertAmbulance,
			travelTime: 5 * 60
		});
		
		containerConfigs.push({
			amount: 1,
			name: `SMUR-001`,
			availabilityTime: 5 * 60,
			templateId: smur,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `SMUR-002`,
			availabilityTime: 20 * 60,
			templateId: smur,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `SMUR-003`,
			availabilityTime: 30 * 60,
			templateId: smur,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `SMUR-004`,
			availabilityTime: 50 * 60,
			templateId: smur,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `SMUR-005`,
			availabilityTime: 60 * 60,
			templateId: smur,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `Heli-001`,
			availabilityTime: 0 * 60,
			templateId: helicopter,
			travelTime: 5 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `Heli-002`,
			availabilityTime: 15 * 60,
			templateId: helicopter,
			travelTime: 15 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `Heli-003`,
			availabilityTime: 40 * 60,
			templateId: helicopter,
			travelTime: 25 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `Heli-004`,
			availabilityTime: 50 * 60,
			templateId: helicopter,
			travelTime: 30 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `Heli-005`,
			availabilityTime: 55 * 60,
			templateId: helicopter,
			travelTime: 30 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `PICA-001`,
			availabilityTime: 55 * 60,
			templateId: pica,
			travelTime: 2 * 60
		});
		containerConfigs.push({
			amount: 1,
			name: `PMA-001`,
			availabilityTime: 0 * 60,
			templateId: pma,
			travelTime: 5 * 60
		});

		containerConfigs.push({
			amount: 1,
			name: `PC-001`,
			availabilityTime: 0 * 60,
			templateId: pcSanitaire,
			travelTime: 10 * 60
		});

		containerConfigs.push({
			amount: 1,
			name: `ACSMCS-001`,
			availabilityTime: 0 * 60,
			templateId: acsMcs,
			travelTime: 5 * 60
		});
	
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
