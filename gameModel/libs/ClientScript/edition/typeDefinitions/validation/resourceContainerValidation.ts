import { ResourceContainerDefinitionName } from '../../../game/common/resources/resourceContainer';
import { ContainerConfigurationData } from '../../../game/loaders/resourceLoader';
import { GenericValidationContext, GenericValidationMessage } from './validationContext';

export function resourceContainersValidator(
  resourceContainers: ContainerConfigurationData[],
  ctx: GenericValidationContext
): GenericValidationMessage[] {
  const result: GenericValidationMessage[] = [];

  // Note : cannot happen through the scenario edition interface
  const acsMcsContainer: ResourceContainerDefinitionName = 'ACS-MCS';
  if (!resourceContainers.some(container => container.payload.type === acsMcsContainer)) {
    result.push({
      id: 'no-acs-mcs',
      level: 'ERROR',
      title: 'ACS/MCS package missing',
      description:
        'The simulation requires an ACS/MCS package to function correctly.<br/>Please configure an ACS/MCS package in the Resources tab.',
      validationContext: ctx,
    });
  }

  return result;
}
