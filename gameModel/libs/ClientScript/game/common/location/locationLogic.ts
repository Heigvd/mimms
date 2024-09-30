import { getTranslation } from '../../../tools/translation';
import { TranslationKey } from '../baseTypes';
import {
  createFixedMapEntityInstanceFromAnyObject,
  FixedMapEntity,
  SelectedPositionType,
} from '../events/defineMapObjectEvent';
import { LOCATION_ENUM } from '../simulationState/locationState';

// -------------------------------------------------------------------------------------------------
// translations
// -------------------------------------------------------------------------------------------------

const translationCategory: keyof VariableClasses = 'mainSim-locations';

export function getLocationShortTranslation(location: LOCATION_ENUM): string {
  const key: TranslationKey = `location-${location.toLowerCase()}`;
  return getTranslation(translationCategory, key + '-short');
}

export function getLocationLongTranslation(location: LOCATION_ENUM): string {
  const key: TranslationKey = `location-${location.toLowerCase()}`;
  return getTranslation(translationCategory, key);
}

// -------------------------------------------------------------------------------------------------
// selection
// -------------------------------------------------------------------------------------------------

export function getIndexOfSelectedChoice(mapLocation: FixedMapEntity): number | undefined {
  const fixedMapEntity: FixedMapEntity = createFixedMapEntityInstanceFromAnyObject(mapLocation);
  const selectedPosition = fixedMapEntity.getGeometricalShape().selectedPosition;
  const availablePositions = fixedMapEntity.getGeometricalShape().availablePositions ?? [];

  let result: number | undefined = undefined;
  availablePositions.forEach((position: SelectedPositionType, index: number) => {
    // FIXME is there a less dirty way to compare ?
    if (JSON.stringify(position) === JSON.stringify(selectedPosition)) {
      result = index;
    }
  });

  return result;
}

// -------------------------------------------------------------------------------------------------
//
// -------------------------------------------------------------------------------------------------
