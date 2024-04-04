import { entries } from '../../../tools/helper';
import { resourceLogger } from '../../../tools/logger';
import { SimFlag } from '../actions/actionTemplateBase';
import { InterventionRole } from '../actors/actor';
import { ActorId, GlobalEventId, TranslationKey } from '../baseTypes';
import { ResourceMobilizationEvent } from '../localEvents/localEventBase';
import { localEventManager } from '../localEvents/localEventManager';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  buildContainerDefinition,
  ResourceContainerConfig,
  ResourceContainerDefinition,
  ResourceContainerDefinitionId,
  ResourceContainerType,
} from './resourceContainer';
import { ResourceType } from './resourceType';

const containerDefinitions: Record<ResourceContainerDefinitionId, ResourceContainerDefinition> = {};

export function getContainerDef(id: ResourceContainerDefinitionId) {
  return containerDefinitions[id];
}

export function getAllContainerDefs(): Record<
  ResourceContainerDefinitionId,
  ResourceContainerDefinition
> {
  return containerDefinitions;
}

/**
 * Call this function when the resource.tsv file is updated (using Client Console)
 */
export async function loadContainerConfigFile() {
  const tsv = await Helpers.downloadFile(`resource/resource.tsv`, 'TEXT');
  const s = `Variable.find(gameModel, 'containers_config').setProperty('config', ${JSON.stringify(
    tsv
  )})`;
  await APIMethods.runScript(s, {}).then(response => {
    wlog('script executed', response);
  });
}

export function loadEmergencyResourceContainers(): ResourceContainerConfig[] {
  const containerConfigs: ResourceContainerConfig[] = [];
  const tsv = Variable.find(gameModel, 'containers_config').getProperties()['config'];

  if (!tsv) return containerConfigs;
  if (!tsv.startsWith('<!DOCTYPE')) {
    const emergencyAmbulance = addContainerDefinition('Ambulance', 'emergencyAmbulance', {
      ambulance: 1,
      ambulancier: 2,
    });

    const intermediateAmbulance = addContainerDefinition('Ambulance', 'intermediateAmbulance', {
      technicienAmbulancier: 1,
      ambulancier: 1,
      ambulance: 1,
    });

    const transfertAmbulance = addContainerDefinition('Ambulance', 'transferAmbulance', {
      ambulance: 1,
      technicienAmbulancier: 1,
      secouriste: 1,
    });

    const helicopter = addContainerDefinition('Helicopter', 'helicopter', {
      helicopter: 1,
      ambulancier: 1,
      medecinSenior: 1,
    });

    const smur = addContainerDefinition('SMUR', 'smur', { ambulancier: 1, medecinJunior: 1 });

    const acsMcs = addContainerDefinition(
      'ACS-MCS',
      'acs-mcs',
      {},
      ['ACS', 'MCS'],
      [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED]
    );

    const pma = addContainerDefinition('PMA', 'pma', { secouriste: 4 });

    const pica = addContainerDefinition('PICA', 'pica', { secouriste: 10 });

    const pcSanitaire = addContainerDefinition('PCS', 'pcs', {}, [], [SimFlag.PCS_ARRIVED]);
    tsv
      .split('\n')
      .slice(1)
      .forEach(line => {
        const l = line.split('\t');
        if (!l || l.length !== 4) {
          resourceLogger.warn('Malformed resource container configuration', l);
          return;
        }
        let definition = null;
        switch (l[0]) {
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
            resourceLogger.warn('malformed resource container configuration', l);
        }
        containerConfigs.push({
          amount: 1,
          name: l[1] || 'UNAMED',
          availabilityTime: +l[2] * 60 || 0,
          templateId: definition,
          travelTime: +l[3] * 60 || 60,
        });
      });
  }
  resourceLogger.info('CONTAINER CONFIGS', containerConfigs);
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
export function resolveResourceRequest(
  globalEventId: GlobalEventId,
  request: Record<ResourceContainerType, number>,
  senderId: ActorId,
  state: MainSimulationState
) {
  const containers = state.getResourceContainersByType();
  const now = state.getSimTime();
  entries(request)
    .filter(([_, a]) => a > 0)
    .forEach(([typeId, requestedAmount]) => {
      // order by time of availability
      const cs: ResourceContainerConfig[] = (containers[typeId] || []).filter(c => c.amount > 0);
      cs.sort((a, b) => a.availabilityTime - b.availabilityTime);
      let found = 0;
      for (let i = 0; i < cs.length && found < requestedAmount; i++) {
        const c = cs[i];
        const n = Math.min(requestedAmount - found, c.amount);
        // n > 0 by construction
        found += n;
        c.amount -= n; // STATE CHANGE HERE

        const departureTime = Math.max(c.availabilityTime, now);
        const definition = getContainerDef(c.templateId);
        const evt = new ResourceMobilizationEvent(
          globalEventId,
          now,
          senderId,
          departureTime,
          c.travelTime,
          definition.uid,
          n,
          c.name
        );
        wlog('MOB EVENT *********** ', evt);
        localEventManager.queueLocalEvent(evt);
      }
    });
}
