export function getStyle(feature: any): LayerStyleObject {
	wlog(typeof feature)
	wlog(feature)

	return {
		fill: {
			type: 'FillStyle',
			color: feature.getProperties().fill.color,
		},
		stroke: {
			type: 'StrokeStyle',
			color: feature.getProperties().stroke.color,
			width: feature.getProperties().stroke.width,
		},

	}
}

const debugStyle = {
	"image": {
		"fill": {
			"color":"Yellow",
			"type":"FillStyle"
		},
		"radius":10,
		"stroke":{
			"color":"Black",
			"lineCap":"round",
			"lineJoin":"round",
			"miterLimit":10,
			"type":"StrokeStyle",
			"width":1
		},
		"type":"CircleStyle"
		}
}

/**
 * Icon style example (should be a function)
 */
const iconStyle: ImageStyleObject = {
		type: 'IconStyle',
		achor: [0,0],
		anchorXUnits: 'fraction',
		anchorYUnits: 'pixels',
		src: '/dead_man.png',
}

const iconLayer: LayerStyleObject = {
	image: iconStyle
}

export function getIconStyle() {
	return iconLayer;
}