import { FeatureCollection } from '../gameMap/types/featureTypes';
import { getEmptyFeatureCollection } from '../gameMap/utils/mapUtils';
import {
  getActiveMapEntityDescriptors,
  MapEntityDescriptor,
} from '../mikkWIP/mapEntityDescriptors';

export function getMapActivablesLayer() {
  return getLayer(getActiveMapEntityDescriptors(), 'active');
}

function getLayer(
  activables: Record<string, MapEntityDescriptor>,
  name: string
): FeatureCollection {
  let layer = getEmptyFeatureCollection(name);

  const meds = Object.values(activables);
  for (const med of meds) {
    getGenericFeature(med, layer);
  }

  return layer;
}

// TODO One function for layer generation ?
function getGenericFeature(
  descriptor: MapEntityDescriptor,
  layer: FeatureCollection
): FeatureCollection {
  for (const mapObject of descriptor.mapObjects) {
    const feature: any = {
      type: 'Feature',
      geometry: {
        type: mapObject.type,
        coordinates: mapObject.geometry,
      },
      properties: {
        type: mapObject.type,
        id: descriptor.uid, // TODO Better id ?
        name: descriptor.tag, // TODO Better name ?
        // TODO Icon ?
        // TODO rotation ?
      },
    };

    layer.features.push(feature);
  }

  return layer;
}

///// LAYER STYLES /////

export function getActivableLayerStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();
  const geometryType = properties.type;
  // TODO Implement all styles
  switch (geometryType) {
    case 'Point':
      return getPointStyle(feature);
    default:
      return {};
  }
}

function getPointStyle(_feature: any): LayerStyleObject {
  const circleStyle: CircleStyleObject = {
    type: 'CircleStyle',
    fill: {
      type: 'FillStyle',
      color: 'pink',
    },
    radius: 10,
  };

  return { image: circleStyle };
}
