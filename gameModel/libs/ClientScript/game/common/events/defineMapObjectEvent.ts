import { InterventionRole } from "../actors/actor";
import { ActorId, SimDuration, SimTime } from "../baseTypes";
import { ActionCreationEvent } from "./eventTypes";

export type PointLikeObjects = PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][];
export type SelectedPositionType = PointLikeObject | PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][] | undefined;
export type AvailablePositionType = PointLikeObject[] | PointLikeObject[][] | PointLikeObject[][][] | PointLikeObject[][][][] | undefined;

export enum BuildingStatus {
	selection = "selection",
	inProgress = "inProgress",
	ready = "ready"
}

export abstract class FixedMapEntity {
  ownerId!: ActorId;
  name!: string;
  id!: string; //symbolicPosition, LOCATION_ENUM
  startTimeSec?: SimTime;
  durationTimeSec?: SimDuration;
  icon?: string;
  leaderRoles!: InterventionRole[];
  buildingStatus!: BuildingStatus;

  abstract getGeometricalShape(): GeometricalShape;
}

export class GeometryBasedFixedMapEntity extends FixedMapEntity {
	geometricalShape!: GeometricalShape;

	constructor(ownerId: ActorId, name: string, id: string, leaderRoles: InterventionRole[], geometricalShape: GeometricalShape, buildingStatus: BuildingStatus, icon?: string){
		super();
		this.ownerId = ownerId;
		this.name = name;
		this.id = id;
		this.leaderRoles = leaderRoles;
		this.icon = icon;
		this.geometricalShape = geometricalShape;
		this.buildingStatus = buildingStatus;
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
		if (selectedPosition)
			this.selectedPosition = selectedPosition;
	}

	getShapeCenter(): PointLikeObject {
		//TODO implement!
		return [0, 0];
	}
}

export class MultiPointGeometricalShape extends GeometricalShape {
	override selectedPosition?: PointLikeObject[] = undefined;
	override availablePositions: PointLikeObject[][] = [];
	override olGeometryType: string = 'MultiPoint';

	constructor(availablePositions: PointLikeObject[][], selectedPosition?: PointLikeObject[]) {
		super();
		this.availablePositions = availablePositions;
		if (selectedPosition)
			this.selectedPosition = selectedPosition;
	}


	getShapeCenter(): PointLikeObject {
		//TODO implement!
		return [0, 0];
	}
}

export class LineStringGeometricalShape extends GeometricalShape {
	override selectedPosition?: PointLikeObject[] = undefined;
	override availablePositions: PointLikeObject[][] = [];
	override olGeometryType: string = 'LineString';

	constructor(availablePositions: PointLikeObject[][], selectedPosition?: PointLikeObject[]) {
		super();
		this.availablePositions = availablePositions;
		if (selectedPosition)
			this.selectedPosition = selectedPosition;
	}

	getShapeCenter(): PointLikeObject {
		//TODO implement!
		return [0, 0];
	}
}

export class MultiLineStringGeometricalShape extends GeometricalShape {
	override selectedPosition?: PointLikeObject[][] = undefined;
	override availablePositions: PointLikeObject[][][] = [];
	override olGeometryType: string = 'MultiLineString';

	constructor(availablePositions: PointLikeObject[][][], selectedPosition?: PointLikeObject[][]) {
		super();
		this.availablePositions = availablePositions;
		if (selectedPosition)
			this.selectedPosition = selectedPosition;
	}

	getShapeCenter(): PointLikeObject {
		//TODO implement!
		return [0, 0];
	}
}

export class PolygonGeometricalShape extends GeometricalShape {
	override selectedPosition?: PointLikeObject[][] = undefined;
	override availablePositions: PointLikeObject[][][] = [];
	override olGeometryType: string = 'Polygon';

	constructor(availablePositions: PointLikeObject[][][], selectedPosition?: PointLikeObject[][]) {
		super();
		this.availablePositions = availablePositions;
		if (selectedPosition)
			this.selectedPosition = selectedPosition;
	}

	getShapeCenter(): PointLikeObject {
		//TODO implement!
		return [0, 0];
	}
}

export class MultiPolygonGeometricalShape extends GeometricalShape {
	override selectedPosition?: PointLikeObject[][][] = undefined;
	override availablePositions: PointLikeObject[][][][] = [];
	override olGeometryType: string = 'MultiPolygon';

	constructor(availablePositions: PointLikeObject[][][][], selectedPosition?: PointLikeObject[][][]) {
		super();
		this.availablePositions = availablePositions;
		if (selectedPosition)
			this.selectedPosition = selectedPosition;
	}

	getShapeCenter(): PointLikeObject {
		//TODO implement!
		return [0, 0];
	}
}

//not useful anymore... we use everything as geometry based
/*export class FeatureBasedFixedMapEntity extends FixedMapEntity {
	featureKey!: string;
  	selectedFeatureId?: string;
	featureIds!: string[];

	getGeometricalShape(): GeometricalShape {
		//TODO: compute centroide
		const position = new PointGeometricalShape();
		position.selectedPosition = [0,0];
		return position;
	}
}*/

export interface SelectionFixedMapEntityEvent extends ActionCreationEvent {
  durationSec: SimDuration;
  fixedMapEntity: FixedMapEntity;
}

export function createFixedMapEntityInstanceFromAnyObject(obj: any): FixedMapEntity{

	let geometricalShape: GeometricalShape;
	switch (obj.geometricalShape.olGeometryType){
		case 'Point':
			geometricalShape = new PointGeometricalShape(obj.geometricalShape.availablePositions, obj.geometricalShape.selectedPosition);
			break;
		case 'MultiPoint':
			geometricalShape = new MultiPointGeometricalShape(obj.geometricalShape.availablePositions, obj.geometricalShape.selectedPosition);
			break;
		case 'LineString':
			geometricalShape = new LineStringGeometricalShape(obj.geometricalShape.availablePositions, obj.geometricalShape.selectedPosition);
			break;
		case 'MultiLineString':
			geometricalShape = new MultiLineStringGeometricalShape(obj.geometricalShape.availablePositions, obj.geometricalShape.selectedPosition);
			break;
		case 'Polygon':
			geometricalShape = new PolygonGeometricalShape(obj.geometricalShape.availablePositions, obj.geometricalShape.selectedPosition);
			break;
		case 'MultiPolygon':
			geometricalShape = new MultiPolygonGeometricalShape(obj.geometricalShape.availablePositions, obj.geometricalShape.selectedPosition);
			break;
	}
	return new GeometryBasedFixedMapEntity(obj.ownerId, obj.name, obj.id, obj.leaderRoles, geometricalShape!, obj.buildingStatus, obj.icon);
}