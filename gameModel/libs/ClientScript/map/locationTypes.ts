import { Point } from './point2D';

export type Location = Point & {
	mapId: string;
};

export type NamedLocation = Location & {
	name: string;
};

export interface Located {
	location: Location | undefined;
	direction: Location | undefined;
}

export type LocationState = Located & {
	type: 'Human';
	id: string;
	time: number;
	lineOfSight: Point[] | undefined;
};

export interface PositionAtTime {
	time: number;
	location: Location | undefined;
	direction: Location | undefined;
}
