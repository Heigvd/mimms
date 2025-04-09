import { resourceLogger } from '../../../../tools/logger';
import { SimFlag } from '../../actions/actionTemplateBase';
import { InterventionRole } from '../../actors/actor';
import { ResourceContainerDefinitionId, TranslationKey } from '../../baseTypes';
import {
  buildContainerDefinition,
  ResourceContainerConfig,
  ResourceContainerDefinition,
  ResourceContainerType,
} from '../../resources/resourceContainer';
import { ResourceType } from '../../resources/resourceType';

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

  const transferAmbulance: ResourceContainerDefinitionId = addContainerDefinition(
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
        definition = transferAmbulance;
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
