import { SelectFeature } from "../../game/common/events/defineMapObjectEvent";
import { getCurrentState } from "../../game/mainSimulationLogic";

export function getBuildingsLayer(feature: any, resolution: number) {
	let style: LayerStyleObject;
	style = ({ "fill": { "color": "#CCD2D7", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 } });
	const selectionIds = getCurrentState().getMapLocations().filter(f => f.geometryType === 'Select').flatMap(f => (f as SelectFeature).featureIds);

	if (Context.mapState.state.mapSelect) {
		if (Context.mapState.state.selectionIds.includes(feature.get(Context.mapState.state.selectionKey))) {
			style = ({ "fill": { "color": "orange", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 } });
		}
	}

	// TODO, featureKey shouldn't be hardcoded
	if (selectionIds.includes(feature.get('@id'))) {
		style = ({"fill":{"color":"red","type":"FillStyle"},"stroke":{"color":"#B1BFCD","lineCap":"round","lineJoin":"round","miterLimit":10,"type":"StrokeStyle","width":1}});
	}

	return style;
}

export function getBuildingSource() {
	return 'maps/GVA-center/buildings.geojson';
}

