import {
  LineMapObject,
  MapEntityDescriptor,
  PointMapObject,
  PolygonMapObject,
} from '../../game/common/mapEntities/mapEntityDescriptor';
import { MapEntityUIState, SupportedDrawType } from '../UIfacade/locationConfigFacade';
import { LocationValidationContext } from '../typeDefinitions/validation/validationContext';
import { Uid } from '../../game/common/interfaces';
import {
  FlatMapEntity,
  fromFlatMapEntity,
  getMapEntityDefinition,
  toFlatMapEntity,
} from '../typeDefinitions/mapEntityDefinition';
import {
  FlatMapObject,
  fromFlatMapObject,
  getMapObjectDefinition,
  toFlatMapObject,
} from '../typeDefinitions/mapObjectDefinition';
import { scenarioEditionLogger } from '../../tools/logger';
import { locationEnumConfig } from '../../game/common/mapEntities/locationEnumConfig';
import { getChildren } from './parentedUtils';
import { getLocationTranslation } from '../../UIfacade/locationFacade';
import { ValidationMessage } from '../typeDefinitions/definition';
import { getInitialMapEntityUIState } from './controllerInstances';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { CreationOptionsBase, DataControllerBase, MapEntityFlatType } from './dataControllerBase';

export interface MapEntityCreationOptions extends CreationOptionsBase {
  location?: LOCATION_ENUM;
  drawType?: SupportedDrawType;
  drawnGeometry?:
    | PointMapObject['geometry']
    | LineMapObject['geometry']
    | PolygonMapObject['geometry'];
}

export class MapEntityController extends DataControllerBase<
  MapEntityDescriptor,
  MapEntityFlatType,
  MapEntityUIState,
  MapEntityCreationOptions,
  LocationValidationContext
> {
  private static readonly MAP_ENTITY_ROOT: string = 'MAP_ENTITY_ROOT';

  protected override isSibling(target: MapEntityFlatType, candidate: MapEntityFlatType): boolean {
    if (target.type === 'mapEntity' && candidate.type === 'mapEntity') {
      return target.binding === candidate.binding;
    }
    return true;
  }

  protected flatten(input: Record<string, MapEntityDescriptor>): Record<string, MapEntityFlatType> {
    const flattened: Record<Uid, MapEntityFlatType> = {};

    Object.entries(input).forEach(([uid, mapEntity]) => {
      // map entities
      flattened[uid] = toFlatMapEntity(mapEntity, MapEntityController.MAP_ENTITY_ROOT);
      // break down map objects
      mapEntity.mapObjects.forEach(mapObject => {
        flattened[mapObject.uid] = toFlatMapObject(mapObject, uid);
      });
    });
    return flattened;
  }

  protected recompose(
    flattened: Record<string, MapEntityFlatType>
  ): Record<string, MapEntityDescriptor> {
    const tree: Record<Uid, MapEntityDescriptor> = {};
    // create map entities descriptors with empty map objects array
    Object.values(flattened)
      .filter(element => element.superType === 'mapEntity')
      .map(e => e as FlatMapEntity) // safe cast
      .forEach((fme: FlatMapEntity) => {
        tree[fme.uid] = fromFlatMapEntity(fme);
      });

    // fill in map objects
    Object.values(flattened)
      .filter(elem => elem.superType === 'geometry')
      .map(e => e as FlatMapObject) // safe cast
      .forEach((mapObj: FlatMapObject) => {
        const parentMapEntity = tree[mapObj.parent];
        if (parentMapEntity) {
          parentMapEntity.mapObjects.push(fromFlatMapObject(mapObj));
        } else {
          scenarioEditionLogger.error(
            'Found some orphan map object in map entity data, it will be lost when saving',
            mapObj
          );
        }
      });

    return tree;
  }

  protected override createNewInternal(
    parentId: string,
    type: MapEntityFlatType['superType'],
    options: MapEntityCreationOptions
  ): MapEntityFlatType {
    switch (type) {
      case 'mapEntity': {
        const newMapEntity = getMapEntityDefinition().getDefault();
        if (options.location) {
          newMapEntity.binding = options.location;
        } else {
          scenarioEditionLogger.error(
            'Missing location in creation options, using default',
            newMapEntity.binding
          );
        }
        const fme = toFlatMapEntity(newMapEntity, MapEntityController.MAP_ENTITY_ROOT);
        this.assignNewTagName(fme);
        return fme;
      }
      case 'geometry': {
        if (options.drawType && options.drawnGeometry && options.location) {
          const newGeometry = getMapObjectDefinition(options.drawType).getDefault();
          newGeometry.geometry = options.drawnGeometry;
          if (newGeometry.type === 'Point') {
            const icon = locationEnumConfig[options.location]?.icon;
            if (icon) {
              newGeometry.icon = icon;
            }
          }
          return toFlatMapObject(newGeometry, parentId);
        } else {
          scenarioEditionLogger.error(
            'Incomplete options to create a new geometry, creating default point',
            parentId,
            options
          );
          return toFlatMapObject(getMapObjectDefinition('Point').getDefault(), parentId);
        }
      }
    }
  }

  private assignNewTagName(newObject: FlatMapEntity): void {
    // fetch the already existing siblings
    const siblings = getChildren(newObject.parent, this.getFlatData());
    const dfltName = getLocationTranslation(newObject.binding);
    let candidate = dfltName;
    let i = 2;
    while (
      Object.values(siblings).some(obj => obj.superType === 'mapEntity' && obj.tag === candidate)
    ) {
      candidate = dfltName + ' ' + i;
      i++;
    }
    newObject.tag = candidate;
  }

  protected validateInternal(
    value: MapEntityDescriptor
  ): ValidationMessage<LocationValidationContext>[] {
    return getMapEntityDefinition().validator(value, {
      page: 'locations',
      targetState: getInitialMapEntityUIState(),
    });
  }
}
