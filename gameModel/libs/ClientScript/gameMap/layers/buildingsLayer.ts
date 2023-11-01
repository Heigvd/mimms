import { SelectFeature } from "../../game/common/events/defineMapObjectEvent";
import { getCurrentState } from "../../game/mainSimulationLogic";

export function getBuildingsLayer(feature: any, resolution: number) {
	let style: LayerStyleObject;
	const mapState = Context.mapState.state;
	style = ({ "fill": { "color": "#CCD2D7", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 } });
	const selectionFeatures = getCurrentState().getMapLocations().filter(f => f.geometryType === 'Select').flatMap(f => (f as SelectFeature).featureIds);

	if (mapState.mapSelect && mapState.selectionState.featureKey) {
		if (mapState.selectionState.featureIds.includes(feature.get(mapState.selectionState.featureKey))) {
			style = ({ "fill": { "color": "orange", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 } });
		}
	}

	// TODO, featureKey shouldn't be hardcoded
	if (selectionFeatures.includes(feature.get('@id'))) {
		style = ({"fill":{"color":"red","type":"FillStyle"},"stroke":{"color":"#B1BFCD","lineCap":"round","lineJoin":"round","miterLimit":10,"type":"StrokeStyle","width":1}});
	}

	return style;
}

export function getBuildingSource() {
	return 'maps/GVA-center/buildings.geojson';
}

