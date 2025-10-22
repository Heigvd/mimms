import {
  BuildingStatus,
  FixedMapEntity,
  MultiLineStringGeometricalShape,
  MultiPointGeometricalShape,
  PointGeometricalShape,
  SelectedPositionType,
  AvailablePositionType,
} from '../../game/common/events/defineMapObjectEvent';
import { getCurrentState } from '../../game/mainSimulationLogic';
import { FeatureCollection } from '../../gameMap/types/featureTypes';
import { getEmptyFeatureCollection } from '../../gameMap/utils/mapUtils';
import { getTranslation } from '../../tools/translation';

// TODO Remove this file once map is fully activables based

/************
 *
 *  Helpers & Tools
 *
 ************/

/**
 * Filter for available layer generation
 *
 * @params MapFeature features
 */
function filterAvailable(feature: FixedMapEntity) {
  if (feature.buildingStatus === BuildingStatus.ready) return true;
  return false;
}

/**
 * Filter for unavailable layer generation
 *
 * @params MapFeature features
 */
function filterUnavailable(feature: FixedMapEntity) {
  if (feature.buildingStatus === BuildingStatus.inProgress) return true;
  return false;
}

/**
 * Returns the end point and rotation for a given line segment
 *
 * @param segment PointLikeObject of segment
 *
 * @returns End point and rotation of segment
 */
export function getLineEndAndRotation(segment: PointLikeObject[]): {
  end: PointLikeObject;
  rotation: number;
} {
  const start = segment[0];
  let end = segment[1];

  let rotation = 0;
  if (end && start) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    rotation = Math.atan2(dy, dx);
  }
  end = end || [0, 0];
  return { end, rotation };
}

/**
 * Creates a layer with the given features and name
 *
 * @params features MapFeature[]
 * @params name string
 *
 * @returns FeatureCollection
 */
function getLayer(features: FixedMapEntity[], name: string): FeatureCollection {
  let layer = getEmptyFeatureCollection();
  layer.name = name;

  if (features.length > 0) {
    features.forEach((f, i) => {
      if (f instanceof FixedMapEntity) {
        // If the feature is a building selection (geometryType: Select) we skip it
        if (f.buildingStatus === BuildingStatus.selection) return;

        // If the feature is an arrow add end points for arrow heads
        // TODO Better validation or templates ?
        if (f.getGeometricalShape() instanceof MultiLineStringGeometricalShape) {
          const position = (f.getGeometricalShape() as MultiLineStringGeometricalShape)
            .selectedPosition as PointLikeObject[][];
          layer = getMultilineFeature(position, i, layer);
        }
        layer = getGenericFeature(
          f,
          f.getGeometricalShape().selectedPosition,
          getTranslation('mainSim-locations', f.name),
          layer
        );
      }
    });
  }
  return layer;
}

/******************************
 *
 *  MainSim Layers Generation
 *
 ******************************/

/**
 * Creates layer with all available features (completed actions)
 *
 * @returns FeatureCollection Layer of available features
 */
export function getAvailableLayer() {
  const features = getCurrentState().getMapLocations();
  const available = features.filter(filterAvailable);

  return getLayer(available, 'AvailableLayer');
}

/**
 * Creates a layer with all unavailable features (ongoing actions)
 */
export function getUnavailableLayer() {
  const features = getCurrentState().getMapLocations();
  const unavailable = features.filter(filterUnavailable);

  return getLayer(unavailable, 'UnavailableLayer');
}

/**
 * Creates a layer from Selection payload
 * This layer displays the available selection when performing a SelectMapObjectAction
 */
export function getSelectionLayer() {
  const selection = Context.mapState?.state.selectionState as FixedMapEntity;

  let layer = getEmptyFeatureCollection();
  layer.name = 'SelectionLayer';

  if (selection instanceof FixedMapEntity) {
    selection.getGeometricalShape().availablePositions!.forEach((position, i: number) => {
      if (selection.getGeometricalShape() instanceof MultiLineStringGeometricalShape) {
        layer = getMultilineFeature(position as PointLikeObject[][], i, layer);
      }

      layer = getGenericFeature(selection, position, String(i), layer);
    });
  }
  return layer;
}

function getMultilineFeature(
  position: PointLikeObject[][],
  positionCounter: number,
  layer: FeatureCollection
): FeatureCollection {
  position.forEach((segment: PointLikeObject[], j) => {
    const { end, rotation } = getLineEndAndRotation(segment);

    const feature: any = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: end,
      },
      properties: {
        type: 'Point',
        name: String(positionCounter),
        icon: 'arrow',
        rotation: -rotation,
        accessType: getTranslation(
          'mainSim-locations',
          j === 0 ? 'location-access' : 'location-regress'
        ),
      },
    };

    layer.features.push(feature);
  });
  return layer;
}

function getGenericFeature(
  entity: FixedMapEntity,
  position: SelectedPositionType | AvailablePositionType,
  name: string,
  layer: FeatureCollection
): FeatureCollection {
  const feature: any = {
    type: 'Feature',
    geometry: {
      type: entity.getGeometricalShape().olGeometryType,
      coordinates: position,
    },
    properties: {
      type: entity.getGeometricalShape().olGeometryType,
      id: entity.id,
      name: name,
      icon:
        entity.getGeometricalShape() instanceof PointGeometricalShape ||
        entity.getGeometricalShape() instanceof MultiPointGeometricalShape
          ? entity.icon
          : undefined,
      rotation:
        entity.getGeometricalShape() instanceof PointGeometricalShape
          ? (entity.getGeometricalShape() as PointGeometricalShape).rotation
          : undefined,
    },
  };
  layer.features.push(feature);
  return layer;
}
