import {
  LineMapObject,
  PointMapObject,
  PolygonMapObject,
} from '../../../game/common/mapEntities/mapEntityDescriptor';
import { scenarioEditionLogger } from '../../../tools/logger';
import { getMapEntityController } from '../../controllers/controllerInstances';
import { FlatMapObject } from '../../typeDefinitions/mapObjectDefinition';
import {
  MapEntityUIState,
  SupportedDrawType,
  updateItem,
} from '../../UIfacade/locationConfigFacade';

export function startDraw(type: SupportedDrawType): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.drawType = type;
  newState.drawActive = true;
  getMapEntityController().updateIState(newState);
}

export function shouldDisableDrawButton(
  drawType1: SupportedDrawType,
  drawType2: SupportedDrawType
): boolean {
  const currentType = getMapEntityController().getLatestIState();
  return (
    currentType.drawActive &&
    (currentType.drawType === drawType1 || currentType.drawType === drawType2)
  );
}

export function stopDraw(): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.drawActive = false;
  getMapEntityController().updateIState(newState);
}

export function onDrawStart(_event: DrawEvent): void {}

export function saveNewMapObject(event: DrawEvent): void {
  const state = getMapEntityController().getLatestIState();

  const parentId = state.selected['mapEntity'];
  if (parentId) {
    const mapObj = getMapEntityController().createNew(parentId, 'geometry');
    const geom = event.feature.getGeometry() as SimpleGeometry;
    const points = geom.getCoordinates();
    switch (mapObj.type) {
      case 'Point':
        {
          const point = points as PointMapObject['geometry'];
          updateItem<FlatMapObject>(mapObj.uid, { geometry: point });
        }
        break;
      case 'LineString':
        {
          const lineString = points as LineMapObject['geometry'];
          updateItem<FlatMapObject>(mapObj.uid, { geometry: lineString });
        }
        break;
      case 'Polygon':
        {
          const polygon = points as PolygonMapObject['geometry'];
          updateItem<FlatMapObject>(mapObj.uid, { geometry: polygon });
        }
        break;
      default:
        scenarioEditionLogger.error('Unexpected geometry type', mapObj);
    }
  } else {
    scenarioEditionLogger.error(
      'Error while creating geometry, no map entity is currently selected'
    );
  }
  stopDraw();
}

export function onDrawAbord(_event: DrawEvent): void {
  stopDraw();
}

// ************** GETTERS **************
export function isDrawActive(): boolean {
  const state = getMapEntityController().getLatestIState();
  return state.drawActive && state.modal === 'opened';
}

export function getDrawType(): SupportedDrawType {
  return getMapEntityController().getLatestIState().drawType;
}
