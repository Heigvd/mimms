export function getLayerStyle(feature: any): LayerStyleObject {

	const properties = feature.getProperties();
	const geometryType = properties.type;
	let style;

	switch (geometryType) {
		case 'Point':
			style = getPointStyle(feature);
			break;
		case 'MultiPolygon':
			style = getMultiPolygonStyle(feature);
			break;
	}

	return style;
}

function getPointStyle(feature: any): LayerStyleObject {

	const properties = feature.getProperties();
	const icon = properties.icon;

	const iconStyle: ImageStyleObject = {
		type: 'IconStyle',
		achor: [0.5, 0.5],
		displacement: [0, 300],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: `/maps/mapIcons/${icon}.svg`,
		scale: .1,
		opacity: 1,
	}

	return { image: iconStyle };
}

function getMultiPolygonStyle(feature: any): any {
	const properties = feature.getProperties();

	const fill: FillStyleObject = {
		type: 'FillStyle',
		// TODO CC = 80% opacity
		color: '#BCBFECCC',
	};

	const stroke: StrokeStyleObject = {
		type: 'StrokeStyle',
		color: '#575FCF',
		lineCap: 'round',
		lineJoin: 'round',
		width: 5,
	}

	const text: TextStyleObject = {
		type: 'TextStyle',
		text: properties.name || 'No name',
		textAlign: 'center',
	}

	return { fill, stroke, text };
}