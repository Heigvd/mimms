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
      startSegment: 'start-segment--down chantier-pma__start-segment',
      endSegment: 'end-segment--down chantier-pma__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.chantier,
      locationEnd: LOCATION_ENUM.nidDeBlesses,
      startSegment: 'start-segment--none',
      endSegment: 'end-segment--straight-down chantier-nid-blesses__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.nidDeBlesses,
      locationEnd: LOCATION_ENUM.PMA,
      startSegment: 'start-segment--up nid-blesses-pma__start-segment',
      endSegment: 'end-segment--up nid-blesses-pma__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.chantier,
      locationEnd: LOCATION_ENUM.helicopterPark,
      startSegment: 'start-segment--none',
      endSegment: 'end-segment--straight chantier-parc-helico__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.nidDeBlesses,
      locationEnd: LOCATION_ENUM.ambulancePark,
      startSegment: 'start-segment--none',
      endSegment: 'end-segment--straight nid-blesses-parc-ambulance__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.PMA,
      locationEnd: LOCATION_ENUM.helicopterPark,
      startSegment: 'start-segment--up pma-parc-helico__start-segment',
      endSegment: 'end-segment--up pma-parc-helico__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.PMA,
      locationEnd: LOCATION_ENUM.ambulancePark,
      startSegment: 'start-segment--down pma-parc-ambulance__start-segment',
      endSegment: 'end-segment--down pma-parc-ambulance__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.helicopterPark,
      locationEnd: LOCATION_ENUM.remote,
      startSegment: 'start-segment--down parc-helico-hospitals__start-segment',
      endSegment: 'end-segment--down parc-helico-hospitals__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.ambulancePark,
      locationEnd: LOCATION_ENUM.remote,
      startSegment: 'start-segment--up parc-ambulance-hospitals__start-segment',
      endSegment: 'end-segment--up parc-ambulance-hospitals__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.chantier,
      locationEnd: LOCATION_ENUM.ambulancePark,
      startSegment: 'start-segment--down chantier-parc-ambulance__start-segment',
      endSegment: 'end-segment--down chantier-parc-ambulance__end-segment',
    },
    {
      locationStart: LOCATION_ENUM.nidDeBlesses,
      locationEnd: LOCATION_ENUM.helicopterPark,
      startSegment: 'start-segment--up nid-blesses-parc-helico__start-segment',
      endSegment: 'end-segment--up nid-blesses-parc-helico__end-segment',
    },
  ];
}

export function getActiveArrowStyleDefinitions(): ArrowStyleDefinition[] {
  const activeLocations: LOCATION_ENUM[] = [
    ...getAvailableMapActivables(getCurrentState(), 'AnyKind').map(
      mapActivable => mapActivable.binding
    ),
    LOCATION_ENUM.remote,
  ];
  return getArrowStyleDefinitions()
    .filter(
      def =>
        activeLocations.includes(def.locationStart) && activeLocations.includes(def.locationEnd)
    )
    .map(def => ({ ...def, id: def.locationStart + '-' + def.locationEnd }));
}
