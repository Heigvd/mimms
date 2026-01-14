import {
  BuildStatus,
  MapEntityDescriptor,
} from '../../game/common/mapEntities/mapEntityDescriptor';
import {
  getActiveMapEntityDescriptors,
  getMapActivableFromUid,
  getMapEntityDescriptors,
} from '../../game/loaders/mapEntitiesLoader';
import {
  getAvailableActionTemplateById,
  getAvailableChoices,
  isChoiceTemplate,
} from '../../UIfacade/actionFacade';
import { FeatureCollection } from '../types/featureTypes';
import { getEmptyFeatureCollection } from '../utils/mapUtils';
import { getLineExtremityAndRotation } from '../utils/shapeUtils';

// Used in page 43, Map/ActivablesLayer
export function getMapActivablesLayer(): FeatureCollection {
  return getLayer(getActiveMapEntityDescriptors(), 'active', true);
}

export function getMapActivableSelectionLayer() {
  const currentTemplate = getAvailableActionTemplateById(
    Context.interfaceState.state.currentActionUid
  );

  const record: Record<string, MapEntityDescriptor> = {};

  if (isChoiceTemplate(currentTemplate)) {
    const medUids = getAvailableChoices(currentTemplate)
      .filter(c => c.displayedMapEntity)
      .map(c => c.displayedMapEntity!);
    const meds = getMapEntityDescriptors();

    for (const medUid of medUids) {
      record[medUid] = meds[medUid]!;
    }
  }

  return getLayer(record, 'choices', true);
}

/**
 * Create FeatureCollection for given MapEntityDescriptors
 *
 * @params descriptors: Record<string, MapEntityDescriptor>
 * @params name: string
 * @param runtime When true, will query the activables current state.
 * Otherwise the game state will be ignored (used in scenarist)
 *
 * @returns layer: FeatureCollection
 */
export function getLayer(
  descriptors: Record<string, MapEntityDescriptor>,
  name: string,
  runtime: boolean
): FeatureCollection {
  const layer = getEmptyFeatureCollection(name);

  const meds = Object.values(descriptors);
  for (let i = 0; i < meds.length; i++) {
    getGenericFeature(meds[i]!, i, layer, runtime);
  }

  return layer;
}

/**
 * Convert MapEntityDescriptor to feature and add to layer
 *
 * @params descriptor: MapEntityDescriptor
 * @params index: number
 * @params layer: FeatureCollection
 * @param runtime use true for player side (will query activables for current state), use false for scenarist
 *
 * @returns layer: FeatureCollection
 */
function getGenericFeature(
  descriptor: MapEntityDescriptor,
  index: number, // Used for selection
  layer: FeatureCollection,
  runtime: boolean
): FeatureCollection {
  let buildStatus: BuildStatus = 'built';
  if (runtime) {
    const activable = getMapActivableFromUid(descriptor.uid);
    buildStatus = activable?.buildStatus || 'built';
  }

  for (const mapObject of descriptor.mapObjects) {
    const properties = {
      id: descriptor.uid,
      tag: descriptor.tag,
      buildStatus: buildStatus,
      label: I18n.translate(mapObject.label),
      labelOffset: mapObject.labelOffset || [0, 0],
      index: index,
      binding: descriptor?.binding,
    };

    const feature: any = {
      type: 'Feature',
      geometry: {
        type: mapObject.type,
        coordinates: mapObject.geometry,
      },
      properties: {
        ...properties,
        type: mapObject.type,
        icon: mapObject.type === 'Point' ? mapObject.icon : undefined,
      },
    };

    layer.features.push(feature);

    // Add arrowheads in case of LineString
    if (mapObject.type === 'LineString') {
      if (mapObject.lineStart === 'Arrow') {
        const { extremity, rotation } = getLineExtremityAndRotation(mapObject.geometry, 'start');
        if (extremity) {
          layer.features.push(buildArrowHeadFeature(properties, extremity, rotation));
        }
      }

      if (mapObject.lineEnd === 'Arrow') {
        const { extremity, rotation } = getLineExtremityAndRotation(mapObject.geometry, 'end');
        if (extremity) {
          layer.features.push(buildArrowHeadFeature(properties, extremity, rotation));
        }
      }
    }
  }

  return layer;
}

function buildArrowHeadFeature(props: any, extremity: PointLikeObject, rotation: number): any {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: extremity,
    },
    properties: {
      ...props,
      type: 'Point',
      icon: 'arrow',
      src: `/maps/mapIcons/arrow.svg`,
      rotation: rotation,
    },
  };
}
