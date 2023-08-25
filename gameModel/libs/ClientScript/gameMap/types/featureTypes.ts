interface PointFeature {
	type: 'Point';
	coordinates: PointLikeObject;
}

interface LineStringFeature {
	type: 'LineString';
	coordinates: PointLikeObject[];
}

interface PolygonFeature {
	type: 'Polygon';
	coordinates: PointLikeObject[][];
}

interface MultiPolygonFeature {
	type: 'MultiPolygon';
	coordinates: PointLikeObject[][][];
}

type Geometry = PointFeature | LineStringFeature | PolygonFeature | MultiPolygonFeature;

export interface AdvancedFeature {
	type: 'Feature';
	properties?: { [key: string]: unknown };
	geometry: Geometry;
}

export type Feature = Geometry | AdvancedFeature;

interface CRS {
	type: string;
	properties: {
		name: string;
	};
}

export interface FeatureCollection {
	type: 'FeatureCollection';
	name: string;
	crs?: CRS;
	features: Feature[];
}