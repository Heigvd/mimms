import { MapChoiceActionTemplate } from '../../game/common/actions/actionTemplateBase';
import { MapEntityDescriptor } from '../../game/common/mapEntities/mapEntityDescriptor';
import {
  getActiveMapEntityDescriptors,
  getMapActivableFromUid,
  getMapEntityDescriptors,
} from '../../game/loaders/mapEntitiesLoader';
import { FeatureCollection } from '../../gameMap/types/featureTypes';
import { getEmptyFeatureCollection } from '../../gameMap/utils/mapUtils';
import { getLineEndAndRotation } from '../../gameMap/utils/shapeUtils';
import { getAvailableActionTemplateById } from '../../UIfacade/actionFacade';

export const activableSelectionRef = Helpers.useRef<any>('activableSelection', null);

// Used in page 43, Map/ActivablesLayer
export function getMapActivablesLayer() {
  return getLayer(getActiveMapEntityDescriptors(), 'active');
}

// To be used in Scenarist Tools page
export function getScenaristLayer(activables: Record<string, MapEntityDescriptor>) {
  return getLayer(activables, 'activables');
}

/**
 * Create FeatureCollection for current MapChoiceAction selection
 * TODO Could be improved ?
 */
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
      record[medUid] = meds[medUid]!;
    }
  }

  return getLayer(record, 'activableSelection');
}

/**
 * Create FeatureCollection for given MapEntityDescriptors
 *
 * @params descriptors: Record<string, MapEntityDescriptor>
 * @params name: string
 *
 * @returns layer: FeatureCollection
 */
function getLayer(
  descriptors: Record<string, MapEntityDescriptor>,
  name: string
): FeatureCollection {
  const layer = getEmptyFeatureCollection(name);

  const meds = Object.values(descriptors);
  for (let i = 0; i < meds.length; i++) {
    getGenericFeature(meds[i]!, i, layer);
  }

  return layer;
}

/**
 * Convert MapEntityDescriptor to feature and add to layer
 *
 * @params descriptor: MapEntityDescriptor
 * @params index: number
 * @params layer: FeatureCollection
 *
 * @returns layer: FeatureCollection
 */
function getGenericFeature(
  descriptor: MapEntityDescriptor,
  index: number, // Used for selection
  layer: FeatureCollection
): FeatureCollection {
  const activable = getMapActivableFromUid(descriptor.uid);

  for (const mapObject of descriptor.mapObjects) {
    const properties = {
      id: descriptor.uid,
      tag: descriptor.tag,
      buildStatus: activable?.buildStatus,
      label: I18n.translate(mapObject.label),
      //labelOffset: mapObject.labelOffset,
      index: index,
      binding: activable?.binding,
    };

    const feature: any = {
      type: 'Feature',
      geometry: {
        type: mapObject.type,
        coordinates: mapObject.geometry,
      },
      properties: {
        ...properties,
        type: mapObject.type, // d
        icon: mapObject.type === 'Point' ? mapObject.icon : undefined, // d
      },
    };

    layer.features.push(feature);

    // Add arrowheads in case of LineString
    if (mapObject.type === 'LineString') {
      const { end, rotation } = getLineEndAndRotation(mapObject.geometry);
      const feature: any = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: end,
        },
        properties: {
          ...properties,
          type: 'Point',
          icon: 'arrow',
          src: `/maps/mapIcons/arrow.svg`,
          rotation: -rotation,
        },
      };

      layer.features.push(feature);
    }
  }

  return layer;
}
