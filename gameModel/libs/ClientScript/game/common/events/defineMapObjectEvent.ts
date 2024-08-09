import { getLineStringMiddlePoint, getPolygonCentroid } from '../../../gameMap/utils/mapUtils';
import { InterventionRole } from '../actors/actor';
import { ActorId, SimDuration, SimTime, TranslationKey } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { ActionCreationEvent } from './eventTypes';

export type PointLikeObjects =
  | PointLikeObject
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][];
export type SelectedPositionType =
  | PointLikeObject
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][]
  | undefined;
export type AvailablePositionType =
  | PointLikeObject[]
  | PointLikeObject[][]
  | PointLikeObject[][][]
  | PointLikeObject[][][][]
  | undefined;

export enum BuildingStatus {
  selection = 'selection',
  inProgress = 'inProgress',
  ready = 'ready',
  removed = 'removed',
}

export type AccessibilityType = {
  toActors: boolean;
  toResources: boolean;
  toPatients: boolean;
};

export abstract class FixedMapEntity {
  ownerId!: ActorId;
  name!: TranslationKey;
  id!: LOCATION_ENUM; //symbolicPosition, LOCATION_ENUM
  startTimeSec?: SimTime;
  durationTimeSec?: SimDuration;
  icon?: string;
  leaderRoles!: InterventionRole[];
  buildingStatus!: BuildingStatus;
  /** Is it a place that can contain actors / human resources / patients */
  accessibility!: AccessibilityType;

  abstract getGeometricalShape(): GeometricalShape;
}

export class GeometryBasedFixedMapEntity extends FixedMapEntity {
  geometricalShape!: GeometricalShape;

  // TODO see why the ownerId is always set at 0
  constructor(
    ownerId: ActorId,
    name: TranslationKey,
    id: LOCATION_ENUM,
    leaderRoles: InterventionRole[],
    geometricalShape: GeometricalShape,
    buildingStatus: BuildingStatus,
    icon?: string,
    accessibility: AccessibilityType = { toActors: true, toResources: true, toPatients: true }
  ) {
    super();
    this.ownerId = ownerId;
    this.name = name;
    this.id = id;
    this.leaderRoles = leaderRoles;
    this.icon = icon;
    this.geometricalShape = geometricalShape;
    this.buildingStatus = buildingStatus;
    this.accessibility = accessibility;
  }

  getGeometricalShape(): GeometricalShape {
    return this.geometricalShape;
  }
}

export abstract class GeometricalShape {
  olGeometryType!: string;
  selectedPosition?: SelectedPositionType;
  availablePositions!: AvailablePositionType;
  abstract getShapeCenter(): PointLikeObject;
}

export class PointGeometricalShape extends GeometricalShape {
  rotation?: number;
  override selectedPosition?: PointLikeObject = undefined;
  override availablePositions: PointLikeObject[] = [];
  override olGeometryType: string = 'Point';

  constructor(availablePositions: PointLikeObject[], selectedPosition?: PointLikeObject) {
    super();
    this.availablePositions = availablePositions;
    if (selectedPosition) this.selectedPosition = selectedPosition;
  }

  getShapeCenter(): PointLikeObject {
    return this.selectedPosition!;
  }
}

export class MultiPointGeometricalShape extends GeometricalShape {
  override selectedPosition?: PointLikeObject[] = undefined;
  override availablePositions: PointLikeObject[][] = [];
  override olGeometryType: string = 'MultiPoint';

  constructor(availablePositions: PointLikeObject[][], selectedPosition?: PointLikeObject[]) {
    super();
    this.availablePositions = availablePositions;
    if (selectedPosition) this.selectedPosition = selectedPosition;
  }

  getShapeCenter(): PointLikeObject {
    return this.selectedPosition![0]!;
  }
}

export class LineStringGeometricalShape extends GeometricalShape {
  override selectedPosition?: PointLikeObject[] = undefined;
  override availablePositions: PointLikeObject[][] = [];
  override olGeometryType: string = 'LineString';

  constructor(availablePositions: PointLikeObject[][], selectedPosition?: PointLikeObject[]) {
    super();
    this.availablePositions = availablePositions;
    if (selectedPosition) this.selectedPosition = selectedPosition;
  }

  getShapeCenter(): PointLikeObject {
    return getLineStringMiddlePoint(this.selectedPosition!);
  }
}

export class MultiLineStringGeometricalShape extends GeometricalShape {
  override selectedPosition?: PointLikeObject[][] = undefined;
  override availablePositions: PointLikeObject[][][] = [];
  override olGeometryType: string = 'MultiLineString';

  constructor(availablePositions: PointLikeObject[][][], selectedPosition?: PointLikeObject[][]) {
    super();
    this.availablePositions = availablePositions;
    if (selectedPosition) this.selectedPosition = selectedPosition;
  }

  getShapeCenter(): PointLikeObject {
    //Returns middle of first arrow
    return getLineStringMiddlePoint(this.selectedPosition![0]!);
  }
}

export class PolygonGeometricalShape extends GeometricalShape {
  override selectedPosition?: PointLikeObject[][] = undefined;
  override availablePositions: PointLikeObject[][][] = [];
  override olGeometryType: string = 'Polygon';

  constructor(availablePositions: PointLikeObject[][][], selectedPosition?: PointLikeObject[][]) {
    super();
    this.availablePositions = availablePositions;
    if (selectedPosition) this.selectedPosition = selectedPosition;
  }

  getShapeCenter(): PointLikeObject {
    return getPolygonCentroid(this.selectedPosition![0]!);
  }
}

export class MultiPolygonGeometricalShape extends GeometricalShape {
  override selectedPosition?: PointLikeObject[][][] = undefined;
  override availablePositions: PointLikeObject[][][][] = [];
  override olGeometryType: string = 'MultiPolygon';

  constructor(
    availablePositions: PointLikeObject[][][][],
    selectedPosition?: PointLikeObject[][][]
  ) {
    super();
    this.availablePositions = availablePositions;
    if (selectedPosition) this.selectedPosition = selectedPosition;
  }

  getShapeCenter(): PointLikeObject {
    //Returns centroid of first polygon
    return getPolygonCentroid(this.selectedPosition![0]![0]!);
  }
}

//not useful anymore... we use everything as geometry based, probably
/*export class FeatureBasedFixedMapEntity extends FixedMapEntity {
	featureKey!: string;
  	selectedFeatureId?: string;
	featureIds!: string[];

	getGeometricalShape(): GeometricalShape {
		//TODO: compute centroid
		const position = new PointGeometricalShape();
		position.selectedPosition = [0,0];
		return position;
	}
}*/

export interface SelectionFixedMapEntityEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  fixedMapEntity: FixedMapEntity;
}

/*
 * This function is necessary as we do not receive a fixed-map instance from global event but a generic object
 * So we convert the object back to its original instance type
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function createFixedMapEntityInstanceFromAnyObject(obj: any): FixedMapEntity {
  let geometricalShape: GeometricalShape;
  switch (obj.geometricalShape.olGeometryType) {
    case 'Point':
      geometricalShape = new PointGeometricalShape(
        obj.geometricalShape.availablePositions,
        obj.geometricalShape.selectedPosition
      );
      break;
    case 'MultiPoint':
      geometricalShape = new MultiPointGeometricalShape(
        obj.geometricalShape.availablePositions,
        obj.geometricalShape.selectedPosition
      );
      break;
    case 'LineString':
      geometricalShape = new LineStringGeometricalShape(
        obj.geometricalShape.availablePositions,
        obj.geometricalShape.selectedPosition
      );
      break;
    case 'MultiLineString':
      geometricalShape = new MultiLineStringGeometricalShape(
        obj.geometricalShape.availablePositions,
        obj.geometricalShape.selectedPosition
      );
      break;
    case 'Polygon':
      geometricalShape = new PolygonGeometricalShape(
        obj.geometricalShape.availablePositions,
        obj.geometricalShape.selectedPosition
      );
      break;
    case 'MultiPolygon':
      geometricalShape = new MultiPolygonGeometricalShape(
        obj.geometricalShape.availablePositions,
        obj.geometricalShape.selectedPosition
      );
      break;
  }
  return new GeometryBasedFixedMapEntity(
    obj.ownerId,
    obj.name,
    obj.id,
    obj.leaderRoles,
    geometricalShape!,
    obj.buildingStatus,
    obj.icon,
    obj.accessibility
  );
}
