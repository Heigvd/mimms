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
		case 'MultiLineString':
			style = getLineStringStyle(feature);
			break;
		case 'MultiPolygon':
			style = getMultiPolygonStyle(feature);
			break;
	}

	return style;
}

// TODO Eliminated a lot of redundancy, should have distinct getIconStyle and getArrowStyle functions
function getPointStyle(feature: any): LayerStyleObject {

	const properties = feature.getProperties();
	const icon = properties.icon;
	const name = properties.name;
	const rotation = properties.rotation;
	const duration = properties.durationTimeSec;

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

		// Arrow-heads are the only icon to be rotated
		if (rotation) {

			// If selection action and not currently selected return invisible
			if (!(name === Context.interfaceState.state.selectedMapObjectId) && Context.mapState.state.mapSelect) return {};

			iconStyle.rotation = rotation;
			iconStyle.displacement = [0, 0];
			iconStyle.src = '/maps/mapIcons/arrow.svg';
			iconStyle.scale = .08;

			textStyle.text = properties.accessType;
			textStyle.offsetX = .5;
			textStyle.offsetY = -18;
			textStyle.scale = 1.6;
			textStyle.fill = {
				type: 'FillStyle',
				color: 'white',
			};
			textStyle.stroke = {
				type: 'StrokeStyle',
				width: 3,
				color: '#575FCF',
				lineCap: 'round',
				lineJoin: 'round',
			};
		}

		if (icon === Context.mapState.state.selectionState.icon && !duration) {
			// Convert to int to add 1
			const index = parseInt(name, 10) + 1;
			// Define textStyle for Icons
			textStyle.text = String(index);
			textStyle.offsetX = .5;
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

	const circleStyle: ImageStyleObject = {
		type: 'CircleStyle',
		radius: 10,
		fill: {
			type: 'FillStyle',
			color: 'red',
		}
	};

	return { image: circleStyle }

}

function getLineStringStyle(feature: any) {

	const properties = feature.getProperties();
	const name = properties.name;
	const duration = properties.durationTimeSec;

	const strokeStyle = {
		type: 'StrokeStyle',
		color: '#575FCF',
		width: 6,
		lineCap: 'round',
		lineJoin: 'round',
	};

	// If we're currently performing a selection
	if (!(name === Context.interfaceState.state.selectedMapObjectId) && Context.mapState.state.mapSelect && !duration) {
		return {};
	}

	return { stroke: strokeStyle }
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