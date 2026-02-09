import { MapConfig } from '../../../gameMap/utils/mapConfig';
import { GenericValidationContext, GenericValidationMessage } from './validationContext';

export function mapConfigValidator(
  mapConfig: MapConfig,
  ctx: GenericValidationContext
): GenericValidationMessage[] {
  const result: GenericValidationMessage[] = [];

  if (mapConfig.mapId?.length < 1) {
    result.push({
      id: 'no-map-config',
      level: 'ERROR',
      title: 'No map selected',
      description:
        'A map is required to define the simulation location.<br/>Select a map from the Map tab to launch the scenario.',
      validationContext: ctx,
    });
  }

  if (!mapConfig.viewConfigured) {
    result.push({
      id: 'no-map-view',
      level: 'ERROR',
      title: 'No initial player view selected',
      description: 'The simulation area is not defined.<br/>Please select an area in the Map tab.',
      validationContext: ctx,
    });
  }

  return result;
}
