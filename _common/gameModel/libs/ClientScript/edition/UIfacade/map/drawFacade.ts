import {
  LineMapObject,
  PointMapObject,
  PolygonMapObject,
} from '../../../game/common/mapEntities/mapEntityDescriptor';
import { LOCATION_ENUM } from '../../../game/common/simulationState/locationState';
import { scenarioEditionLogger } from '../../../tools/logger';
import { getMapEntityController } from '../../controllers/controllerInstances';
import { MapEntityCreationOptions } from '../../controllers/dataController';
import { MapEntityUIState, SupportedDrawType } from '../locationConfigFacade';

export function toggleDraw(type: SupportedDrawType): void {
  const drawActive = getMapEntityController().getLatestIState().drawActive;
  if (drawActive) {
    stopDraw();
  } else {
    startDraw(type);
  }
}

export function startDraw(type: SupportedDrawType): void {
  const newState: MapEntityUIState = Helpers.cloneDeep(getMapEntityController().getLatestIState());
  newState.drawType = type;
  newState.drawActive = true;
  getMapEntityController().updateIState(newState);
}

export function shouldDisableDrawButton(drawType: SupportedDrawType): boolean {
  const currentType = getMapEntityController().getLatestIState();
  return currentType.drawActive && currentType.drawType !== drawType;
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
    const controller = getMapEntityController();
    const parent = controller.getFlatData()[parentId];
    let location: LOCATION_ENUM | undefined = undefined;
    if (parent?.type === 'mapEntity' && parent.binding) {
      location = parent.binding;
    } else {
      scenarioEditionLogger.error('Cannot create a geometry in unbinded map entity', parent);
      return;
    }

    const drawType = controller.getLatestIState().drawType;
    const creationOptions: MapEntityCreationOptions = {
      parentType: 'mapEntity',
      drawType: drawType,
      location: location,
    };
    const geom = event.feature.getGeometry() as SimpleGeometry;
    const points = geom.getCoordinates();
    switch (drawType) {
      case 'Point':
        creationOptions.drawnGeometry = points as PointMapObject['geometry'];
        break;
      case 'LineString':
        creationOptions.drawnGeometry = points as LineMapObject['geometry'];
        break;
      case 'Polygon':
        creationOptions.drawnGeometry = points as PolygonMapObject['geometry'];
        break;
      default:
        scenarioEditionLogger.error('Unexpected geometry type', drawType);
    }
    if (creationOptions.drawnGeometry) {
      controller.createNew(parentId, 'geometry', creationOptions);
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
