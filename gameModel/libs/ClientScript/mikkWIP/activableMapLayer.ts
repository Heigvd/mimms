import { SelectionFixedMapEntityReduxTemplate } from '../game/common/actions/actionTemplateBase';
import { FeatureCollection } from '../gameMap/types/featureTypes';
import { getEmptyFeatureCollection } from '../gameMap/utils/mapUtils';
import {
  getActiveMapEntityDescriptors,
  getMapEntityDescriptors,
  MapEntityDescriptor,
} from '../mikkWIP/mapEntityDescriptors';
import { getAvailableActionTemplateById } from '../UIfacade/actionFacade';

export function getMapActivablesLayer() {
  return getLayer(getActiveMapEntityDescriptors(), 'active');
}

export function getScenaristLayer(activables: Record<string, MapEntityDescriptor>) {
  return getLayer(activables, 'activables');
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

function getPointStyle(feature: any): LayerStyleObject {
  // TODO maybe player and scenarist shouldn't share styles ?
  let color = 'red';
  if (Context.interfaceState) {
    color = feature.values_.id === Context.interfaceState.state.reduxUid ? 'pink' : 'red';
  }
  if (Context.medState) {
    color = feature.values_.id === Context.medState.state.currentUid ? 'pink' : 'red';
  }

  const circleStyle: CircleStyleObject = {
    type: 'CircleStyle',
    fill: {
      type: 'FillStyle',
      color: color,
    },
    radius: 10,
    // opacity: 1, TODO Not working for some odd reason
  };

  return { image: circleStyle };
}

///// SELECTION LAYER /////

// TODO Convoluted way of getting what we need, improve ?
export function getMapActivableSelectionLayer() {
  const currentTemplate = getAvailableActionTemplateById(
    Context.interfaceState.state.currentActionUid
  );

  let medUids = [];
  const record: Record<string, MapEntityDescriptor> = {};

  if (currentTemplate instanceof SelectionFixedMapEntityReduxTemplate) {
    medUids = currentTemplate.mapEntityDescriptorUids;
    const meds = getMapEntityDescriptors();

    // TODO Better type to remove assertion
    for (const medUid of medUids) {
      record[medUid] = meds[medUid]!;
    }
  }

  return getLayer(record, 'activableSelection');
}

// TODO Implement selection opacity
export function getActivableSelectionLayerStyle(feature: any): LayerStyleObject {
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
