import {
  getAvailableMapActivables,
  LOCATION_ENUM,
} from '../game/common/simulationState/locationState';
import { getCurrentState } from '../game/mainSimulationLogic';

interface ArrowStyleDefinition {
  locationStart: LOCATION_ENUM;
  locationEnd: LOCATION_ENUM;
  startSegment: string;
  endSegment: string;
}

export function getArrowStyleDefinitions(): ArrowStyleDefinition[] {
  return [
    {
      locationStart: LOCATION_ENUM.chantier,
      locationEnd: LOCATION_ENUM.PMA,
      startSegment: 'patient-flow__arrow--chantier-pma-elbow',
      endSegment: 'patient-flow__arrow--chantier-pma-entry',
    },
  ];
}

export function getActiveArrowStyleDefinitions(): ArrowStyleDefinition[] {
  const activeLocations = getAvailableMapActivables(getCurrentState(), 'AnyKind').map(
    mapActivable => mapActivable.binding
  );
  return getArrowStyleDefinitions()
    .filter(
      def =>
        activeLocations.includes(def.locationStart) && activeLocations.includes(def.locationEnd)
    )
    .map(def => ({ ...def, id: def.locationStart + '-' + def.locationEnd }));
}
