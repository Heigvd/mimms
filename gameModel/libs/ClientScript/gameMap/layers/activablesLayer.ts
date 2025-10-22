import { MapChoiceActionTemplate } from '../../game/common/actions/actionTemplateBase';
import {
  LineMapObject,
  MapEntityDescriptor,
} from '../../game/common/mapEntities/mapEntityDescriptor';
import {
  getActiveMapEntityDescriptors,
  getMapActivable,
  getMapEntityDescriptors,
} from '../../game/loaders/mapEntitiesLoader';
import { FeatureCollection } from '../../gameMap/types/featureTypes';
import { getEmptyFeatureCollection } from '../../gameMap/utils/mapUtils';
import { getAvailableActionTemplateById } from '../../UIfacade/actionFacade';

export const activableSelectionRef = Helpers.useRef<any>('activableSelection', null);

// Used in Map/ActivablesLayer
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
  for (let i = 0; i < meds.length; i++) {
    getGenericFeature(meds[i], i, layer);
  }

  return layer;
}

function getGenericFeature(
  descriptor: MapEntityDescriptor,
  index: number, // TODO Improve ? Used for letter generation
  layer: FeatureCollection
): FeatureCollection {
  const activable = getMapActivable(descriptor.uid);

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
        index: index, // TODO Handle indexing here ?
        icon: mapObject.type === 'Point' ? mapObject.icon : undefined,
        buildStatus: activable?.buildStatus, // TODO handle undefined case
        label: mapObject.label,
        labelOffset: mapObject.labelOffset,
      },
    };

    layer.features.push(feature);

    // Add arrowheads in case of LineString
    if (mapObject.type === 'LineString') {
      addArrowHeads(mapObject, layer);
    }
  }

  return layer;
}

///// SELECTION LAYER /////

// TODO Convoluted way of getting what we need, improve ?
export function getMapActivableSelectionLayer() {
  const currentTemplate = getAvailableActionTemplateById(
    Context.interfaceState.state.currentActionUid
  );

  let medUids = [];
  const record: Record<string, MapEntityDescriptor> = {};

  if (currentTemplate instanceof MapChoiceActionTemplate) {
    medUids = currentTemplate.choices.map(c => c.placeholder!);
    const meds = getMapEntityDescriptors();

    for (const medUid of medUids) {
      record[medUid] = meds[medUid];
    }
  }

  return getLayer(record, 'activableSelection');
}

///// HELPERS /////

/**
 * Returns the end point and rotation for a given line segment
 *
 * @param segment PointLikeObject of segment
 *
 * @returns End point and rotation of segment
 */
function getLineEndAndRotation(segment: PointLikeObject[]): {
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

function addArrowHeads(lineMapObject: LineMapObject, layer: FeatureCollection) {
  const { end, rotation } = getLineEndAndRotation(lineMapObject.geometry);
  const feature: any = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: end,
    },
    properties: {
      type: 'Point',
      id: lineMapObject.parent,
      icon: 'arrow',
      src: `/maps/mapIcons/arrow.svg`,
      rotation: -rotation,
      label: lineMapObject.label,
    },
  };

  layer.features.push(feature);
  return layer;
}
