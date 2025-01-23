import { entries } from '../../../tools/helper';
import { resourceLogger } from '../../../tools/logger';
import { getTranslation } from '../../../tools/translation';
import { SimFlag } from '../actions/actionTemplateBase';
import { InterventionRole } from '../actors/actor';
import { getCasuActorId } from '../actors/actorLogic';
import {
  ActorId,
  GlobalEventId,
  ResourceContainerDefinitionId,
  TranslationKey,
} from '../baseTypes';
import {
  AddRadioMessageLocalEvent,
  ResourceMobilizationEvent,
} from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { RadioType } from '../radio/communicationType';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  buildContainerDefinition,
  ResourceContainerConfig,
  ResourceContainerDefinition,
  ResourceContainerType,
} from './resourceContainer';
import { ResourceType } from './resourceType';

const containerDefinitions: Record<ResourceContainerDefinitionId, ResourceContainerDefinition> = {};

export function getContainerDef(id: ResourceContainerDefinitionId): ResourceContainerDefinition {
  return containerDefinitions[id]!;
}

export function getAllContainerDefs(): Record<
  ResourceContainerDefinitionId,
  ResourceContainerDefinition
> {
  return containerDefinitions;
}

export function loadEmergencyResourceContainers(): ResourceContainerConfig[] {
  const containerConfigs: ResourceContainerConfig[] = [];
  const containers = Variable.find(gameModel, 'containers_config').getProperties();

  if (!containers) return containerConfigs;

  const emergencyAmbulance: ResourceContainerDefinitionId = addContainerDefinition(
    'Ambulance',
    'emergencyAmbulance',
    {
      ambulance: 1,
      ambulancier: 2,
    }
  );

  const intermediateAmbulance: ResourceContainerDefinitionId = addContainerDefinition(
    'Ambulance',
    'intermediateAmbulance',
    {
      ambulance: 1,
      technicienAmbulancier: 1,
      ambulancier: 1,
    }
  );

  const transfertAmbulance: ResourceContainerDefinitionId = addContainerDefinition(
    'Ambulance',
    'transferAmbulance',
    {
      ambulance: 1,
      secouriste: 1,
      technicienAmbulancier: 1,
    }
  );

  const helicopter: ResourceContainerDefinitionId = addContainerDefinition(
    'Helicopter',
    'helicopter',
    {
      helicopter: 1,
      ambulancier: 1,
      medecinSenior: 1,
    }
  );

  const smur: ResourceContainerDefinitionId = addContainerDefinition('SMUR', 'smur', {
    ambulancier: 1,
    medecinJunior: 1,
  });

  const acsMcs: ResourceContainerDefinitionId = addContainerDefinition(
    'ACS-MCS',
    'acs-mcs',
    {},
    ['ACS', 'MCS'],
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED]
  );

  const pma: ResourceContainerDefinitionId = addContainerDefinition('PMA', 'pma', {
    secouriste: 4,
  });

  const pica: ResourceContainerDefinitionId = addContainerDefinition('PICA', 'pica', {
    secouriste: 10,
  });

  const pcSanitaire: ResourceContainerDefinitionId = addContainerDefinition(
    'PC-San',
    'pc-san',
    {},
    [],
    [SimFlag.PCS_ARRIVED]
  );

  Object.entries(containers).forEach(([key, value]) => {
    const oneContainer = JSON.parse(value);
    let definition = null;
    switch (oneContainer['type']!) {
      case 'AMB-U':
        definition = emergencyAmbulance;
        break;
      case 'AMB-I':
        definition = intermediateAmbulance;
        break;
      case 'AMB-T':
        definition = transfertAmbulance;
        break;
      case 'SMUR':
        definition = smur;
        break;
      case 'Helico':
        definition = helicopter;
        break;
      case 'ACS-MCS':
        definition = acsMcs;
        break;
      case 'PMA':
        definition = pma;
        break;
      case 'PICA':
        definition = pica;
        break;
      case 'PC':
        definition = pcSanitaire;
        break;
      default:
        definition = emergencyAmbulance;
        resourceLogger.warn('malformed resource container type', oneContainer['type']);
    }
    containerConfigs.push({
      templateId: definition,
      name: key || 'UNNAMED',
      availabilityTime: +oneContainer['availabilityTime']! * 60 || 0,
      travelTime: +oneContainer['travelTime']! * 60 || 60,
      amount: 1,
    });
  });

  resourceLogger.info('CONTAINERS CONFIG', containerConfigs);
  return containerConfigs;
}

function addContainerDefinition(
  type: ResourceContainerType,
  name: TranslationKey,
  resources: Partial<Record<ResourceType, number>>,
  roles: InterventionRole[] = [],
  flags: SimFlag[] = []
): ResourceContainerDefinitionId {
  const c = buildContainerDefinition(type, name, resources, roles, flags);
  containerDefinitions[c.uid] = c;
  return c.uid;
}

export function hasContainerOfType(
  state: Readonly<MainSimulationState>,
  type: ResourceContainerType
): boolean {
  const config = state.getResourceContainersByType()[type];
  return config?.some(c => c.amount > 0);
}

/**
 * This method changes the state, it should only be called during a state update
 * Resolve a resource request made by a player
 * fetch all the resources available and dispatch them
 * if the resource is not available right away it will be sent later but scheduled
 * @param state the current state of the game
 * @param globalEventId the global event id that triggered this request
 * @param senderId the author of the request
 * @param request the amount and type formulated in the request
 */
export function resolveResourceRequest(
  state: MainSimulationState,
  globalEventId: GlobalEventId,
  senderId: ActorId | undefined,
  request: Record<ResourceContainerType, number>
) {
  const containers = state.getResourceContainersByType();
  const now = state.getSimTime();

  const sentContainers: Record<
    number,
    { name: string; def: ResourceContainerDefinition; travelTime: number }[]
  > = {};

  function addDepartureEntry(
    departureTime: number,
    travelTime: number,
    containerName: string,
    containerDef: ResourceContainerDefinition
  ) {
    if (!sentContainers[departureTime]) {
      sentContainers[departureTime] = [];
    }
    sentContainers[departureTime]?.push({
      name: containerName,
      def: containerDef,
      travelTime: travelTime,
    });
  }

  entries(request)
    .filter(([_typeId, requestedAmount]) => requestedAmount > 0)
    .forEach(([typeId, requestedAmount]) => {
      // fetch the containers that still have an amount
      const cs: ResourceContainerConfig[] = (containers[typeId] || []).filter(c => c.amount > 0);
      // ordered by time of availability
      cs.sort((a, b) => a.availabilityTime - b.availabilityTime);
      let foundAmount = 0;
      for (let i = 0; i < cs.length && foundAmount < requestedAmount; i++) {
        const c = cs[i]!;
        const n = Math.min(requestedAmount - foundAmount, c.amount);
        // n > 0 by construction
        foundAmount += n;
        c.amount -= n; // !!! STATE CHANGE HERE !!!

        const departureTime = Math.max(c.availabilityTime, now);
        const definition = getContainerDef(c.templateId);
        const evt = new ResourceMobilizationEvent(
          globalEventId,
          now,
          departureTime,
          c.travelTime,
          definition.uid,
          n,
          c.name
        );
        localEventManager.queueLocalEvent(evt);
        addDepartureEntry(departureTime, c.travelTime, c.name, definition);
      }
    });
  queueResourceDepartureRadioMessageEvents(sentContainers, globalEventId, senderId);
}

/**
 * Generates one radio message per departure time containing all the sent ressources at that time
 * @param sentContainers
 * @param globalEventId
 * @param senderId
 */
function queueResourceDepartureRadioMessageEvents(
  sentContainers: Record<
    number,
    { name: string; def: ResourceContainerDefinition; travelTime: number }[]
  >,
  globalEventId: GlobalEventId,
  senderId: ActorId | undefined
): void {
  Object.entries(sentContainers).forEach(([depTime, sent]) => {
    const dtime = parseInt(depTime);
    const msgs: string[] = [];

    Object.values(sent).forEach(v => {
      msgs.push(buildRadioText(v.travelTime, v.def, v.name));
    });

    const evt = new AddRadioMessageLocalEvent(
      globalEventId,
      dtime,
      getCasuActorId(),
      undefined,
      senderId,
      msgs.join('\n'),
      RadioType.CASU,
      true
    );
    localEventManager.queueLocalEvent(evt);
  });
}

function buildRadioText(travelTime: number, c: ResourceContainerDefinition, name: string): string {
  const parts: string[] = [];
  parts.push(getTranslation('mainSim-resources', 'sending'));
  parts.push(name); // Specific name (e.g. AMB002)
  parts.push('(' + getTranslation('mainSim-resources', c.name) + ')'); // type
  parts.push(getTranslation('mainSim-resources', 'arrival-in', false));
  parts.push(Math.round(travelTime / 60) + '');
  parts.push(getTranslation('mainSim-resources', 'minutes', false));
  return parts.join(' ');
}
