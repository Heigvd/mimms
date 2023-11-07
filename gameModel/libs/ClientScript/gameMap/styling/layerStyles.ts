export function getLayerStyle(feature: any): LayerStyleObject {

	const properties = feature.getProperties();
	const geometryType = properties.type;
	let style;

	switch (geometryType) {
		case 'Point':
			style = getPointStyle(feature);
			break;
		case 'LineString':
			style = getLineStringStyle(feature);
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
	const name = properties.name;

	if (icon) {
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

		const textStyle: TextStyleObject = {
			type: 'TextStyle'
		};

		if (icon === Context.mapState.state.selectionState.icon) {
			iconStyle.opacity = name === Context.interfaceState.state.selectedMapObjectId ? 1 : .5;

			// Convert to int to add 1
			const index = parseInt(name, 10) + 1;
			// Define textStyle for Icons
			textStyle.text = String(index);
			textStyle.offsetY = -18;
			textStyle.scale = 1.6;
			textStyle.opacity = name === Context.interfaceState.state.selectedMapObjectId ? 1 : .5;
			textStyle.fill = {
				type: 'FillStyle',
				color: 'white',
			};
		}

		return { image: iconStyle, text: textStyle };
	}

	const circle: ImageStyleObject = {
		type: 'CircleStyle',
		radius: 10,
		fill: {
			type: 'FillStyle',
			color: 'red',
		}
	};

	return { image: circle }

}

function getLineStringStyle(feature: any) {
	const properties = feature.getProperties();

	const geometry = feature.getGeometry();

	const styles: any[] = [
		{
			type: 'StrokeStyle',
			color: 'red',
			width: 4,
			lineCap: 'round',
			lineJoin: 'round',
		},
	]

	// geometry.forEachSegment((start: PointLikeObject, end: PointLikeObject) => {
	// 	const dx = end[0] - start[0];
	// 	const dy = end[1] - start[1];
	// 	const rotation = Math.atan2(dy, dx);
	// 
	// 	const lineString1 = {
	// 		type: 'LineString',
	// 		coordinates: [end, [end[0] - 20000, end[1] + 20000]]
	// 	}
	// 
	// 	const lineString2 = {
	// 		type: 'LineString',
	// 		coordinates: [end, [end[0] - 20000, end[1] - 20000]]
	// 	}
	// 	
	// 	styles.push({
	// 		geometry: lineString1,
	// 	});
	// 	styles.push({
	// 		geometry: lineString2,
	// 	});
	// });



	const stroke = {
		type: 'StrokeStyle',
		color: 'red',
		width: 4,
		lineCap: 'round',
		lineJoin: 'round',
	}

	return { stroke }
}

function getMultiPolygonStyle(feature: any): any {
	const properties = feature.getProperties();

	const fill: FillStyleObject = {
		type: 'FillStyle',
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