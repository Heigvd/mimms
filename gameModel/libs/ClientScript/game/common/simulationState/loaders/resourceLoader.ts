import { resourceLogger } from '../../../../tools/logger';
import { parseObjectDescriptor } from '../../../../tools/WegasHelper';
import { SimFlag } from '../../actions/actionTemplateBase';
import { InterventionRole } from '../../actors/actor';
import { ResourceContainerDefinitionId, TranslationKey } from '../../baseTypes';
import {
  buildContainerDefinition,
  ResourceContainerConfig,
  ResourceContainerDefinition,
  ResourceContainerDefinitionName,
  ResourceContainerType,
} from '../../resources/resourceContainer';
import { ResourceType } from '../../resources/resourceType';

export interface ContainerConfigurationData {
  mandatory: boolean;
  index: number;
  payload: Omit<ResourceContainerConfig, 'amount' | 'templateId'> & { type: string };
}

/**
 * Configuration data aimed at the scenarist configuration
 */
export function loadResourceContainersConfigurationData(): Record<
  string,
  ContainerConfigurationData
> {
  const desc = Variable.find(gameModel, 'containers_config');
  return parseObjectDescriptor<ContainerConfigurationData>(desc);
}

/**
 * Loads data for the game runtime
 * loads the scenarist container configs and binds them with the container definitions
 * only contains relevant information for the game runtime
 */
export function loadResourceContainersConfiguration(): ResourceContainerConfig[] {
  const data = loadResourceContainersConfigurationData();
  if (!definitionsLoaded) {
    initContainerDefinitions();
  }

  return Object.values(data)
    .filter(config => definitionsMapping[config.payload.type])
    .map(config => {
      return {
        templateId: definitionsMapping[config.payload.type]!,
        name: config.payload.name || 'UNNAMED',
        availabilityTime: (config.payload.availabilityTime || 0) * 60,
        travelTime: (config.payload.travelTime || 1) * 60,
        amount: 1,
      };
    });
}

// ===================== CONTAINER DEFINITIONS ===========================
// Container definitions define the resources content of a container type

export function getContainersDefinitions(): Record<
  ResourceContainerDefinitionId,
  ResourceContainerDefinition
> {
  if (!definitionsLoaded) {
    initContainerDefinitions();
  }
  return containerDefinitions;
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

let definitionsLoaded = false;
const containerDefinitions: Record<ResourceContainerDefinitionId, ResourceContainerDefinition> = {};

/**
 * Maps the friendly name to the definition id
 */
const definitionsMapping: Record<
  ResourceContainerDefinitionName | string,
  ResourceContainerDefinitionId
> = {};

/**
 * Builds hard coded containers definitions, and the mapping from friendly name to unique id
 */
function initContainerDefinitions() {
  if (definitionsLoaded) {
    return;
  }

  definitionsMapping['AMB-U'] = addContainerDefinition('Ambulance', 'emergencyAmbulance', {
    ambulance: 1,
    ambulancier: 2,
  });

  definitionsMapping['AMB-I'] = addContainerDefinition('Ambulance', 'intermediateAmbulance', {
    ambulance: 1,
    technicienAmbulancier: 1,
    ambulancier: 1,
  });

  definitionsMapping['AMB-T'] = addContainerDefinition('Ambulance', 'transferAmbulance', {
    ambulance: 1,
    secouriste: 1,
    technicienAmbulancier: 1,
  });

  definitionsMapping['Helico'] = addContainerDefinition('Helicopter', 'helicopter', {
    helicopter: 1,
    ambulancier: 1,
    medecinSenior: 1,
  });

  definitionsMapping['SMUR'] = addContainerDefinition('SMUR', 'smur', {
    ambulancier: 1,
    medecinJunior: 1,
  });

  definitionsMapping['ACS-MCS'] = addContainerDefinition(
    'ACS-MCS',
    'acs-mcs',
    {},
    ['ACS', 'MCS'],
    [SimFlag.ACS_ARRIVED, SimFlag.MCS_ARRIVED]
  );

  definitionsMapping['PMA'] = addContainerDefinition('PMA', 'pma', {
    secouriste: 4,
  });

  definitionsMapping['PICA'] = addContainerDefinition('PICA', 'pica', {
    secouriste: 10,
  });

  definitionsMapping['PC'] = addContainerDefinition(
    'PC-San',
    'pc-san',
    {},
    [],
    [SimFlag.PCS_ARRIVED]
  );

  definitionsLoaded = true;
  resourceLogger.info('Container definitions loaded', containerDefinitions);
}
