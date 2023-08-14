import { layerDataLogger } from "../../tools/logger";

interface RoadParams {
	color: string;
	size: number
}

function getRoadParams(feature : any, resolution: number): RoadParams {

	let hw = feature.getProperties().highway;
	if(hw){
		hw = hw.split('_')[0];
	}
	hw = hw || 'primary';

	let color = 'white';
	let size = 1;


	switch(hw){
		case 'motorway' :
			color = 'red';
			size = 5;
			break;
		case 'trunk' :
			size = 5;
			color = 'yellow';
			break;
		case 'primary':
			size = 4;
			color = 'lime';
			break;
		case 'secondary':
			color = 'blue';
			size = 2.5;
			break;
		case 'tertiary':
			color = 'peru';
			size = 5;
			break;
		case 'unclassified':
			color = 'hotpink';
			size = 3;
			break;
		case 'residential':
		case 'living':
			color = 'white';
			size = 2.6;
			break;
		case 'pedestrian':
		case 'footway':
			size = 1;
			color = 'teal'
			break;
		case 'service':
		case 'path':
		case 'cycleway':
		case 'steps':
		case 'platform':
			color = 'white';
			size = 1.2;
			break;
		case 'proposed':
		case 'construction':
			color = 'gray';
			size = 1.2;
			break;
		default :
			color = 'black';
			layerDataLogger.debug(hw);
			break;
	}

	
	return {color: color, size: size/resolution};

}

export function getRoadStyle(feature: any, resolution: number): LayerStyleObject[] {
	const {color, size} = getRoadParams(feature, resolution);
	const style : LayerStyleObject[] = 
	[
		{"stroke":{"type":"StrokeStyle","lineCap":"butt","lineJoin":"round","miterLimit":10,"width":size,"color":'black'}},
		{"stroke":{"type":"StrokeStyle","lineCap":"round","lineJoin":"round","miterLimit":10,"width":size*0.9,"color":color}}
	];
	const name = feature.getProperties().name;
	if(name){
		style.push(
			{"text":{"type":"TextStyle","fill":{"type":"FillStyle","color":"white"},"stroke":{"type":"StrokeStyle","lineCap":"round","lineJoin":"round","miterLimit":10, width:3},"text":name, scale:1.25, "placement":"line","overflow":false}}
		)
	}
	return style;
}

export function getRailwayStyle(resolution: number): LayerStyleObject[]{

	const dashSize = 8 / resolution;
	const styleDark : LayerStyleObject = {"stroke":{"type":"StrokeStyle","lineCap":"butt","lineJoin":"round","miterLimit":10,"width":2.3/resolution,"color": "black"}};
	const styleLight : LayerStyleObject ={"stroke":{"type":"StrokeStyle","lineCap":"butt","lineJoin":"round","miterLimit":10,"width":2/resolution,"color": "white", lineDash: [dashSize], lineDashOffset:dashSize}};
	return [styleDark, styleLight];
}

export function getWaterStyle(feature: any, resolution: number): LayerStyleObject{

	const label = feature.getProperties().name;

	const style : LayerStyleObject = {};

	const color = "rgba(80,150,200,0.5)";
	const stroke = "rgb(80,150,200)";
	if(label){
		style.text = {
			"type":"TextStyle",
			"fill":{"type":"FillStyle", color: 'lightskyblue'},
			"stroke":{"type":"StrokeStyle","lineCap":"round","lineJoin":"round","miterLimit":10, width: 2},
			"overflow":true,
			placement : 'line',
			scale : 1.5,
			"text": label
		}

	} else {
	}
	style.stroke = {"type":"StrokeStyle","lineCap":"round","lineJoin":"round","miterLimit":10,"color":stroke};
	style.fill = {"type":"FillStyle","color":color};
	return style;
}
