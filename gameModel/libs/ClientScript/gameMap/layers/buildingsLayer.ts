import { SelectFeature } from "../../game/common/events/defineMapObjectEvent";
import { getCurrentState } from "../../game/mainSimulationLogic";

// TODO REFACTOR AND IMPROVE
export function getBuildingsLayer(feature: any, resolution: number) {
	let style: LayerStyleObject;
	const mapState = Context.mapState.state;
	const interfaceState = Context.interfaceState.state;
	style = ({ "fill": { "color": "#CCD2D7", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 } });
	const selectionFeatures = getCurrentState().getMapLocations().filter(f => f.geometryType === 'Select').flatMap(f => (f as SelectFeature).featureIds);

	// REDUNDANT
	if (mapState.mapSelect && mapState.selectionState.featureKey) {
		const index = mapState.selectionState.featureIds.indexOf(feature.get(mapState.selectionState.featureKey)) + 1;
		if (mapState.selectionState.featureIds.includes(feature.get(mapState.selectionState.featureKey))) {
			style = (
				{ "fill": { "color": "#575FCF80", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 }, "text": { "type": "TextStyle", "text": String(index), "fill": {"type": "FillStyle", "color": "white"}, "scale": 1.2} });
		}
		if (mapState.selectionState.featureIds[interfaceState.selectedMapObjectId] === feature.get(mapState.selectionState.featureKey)) {
			style = ({ "fill": { "color": "#575FCF", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 2 }, "text": { "type": "TextStyle", "text": String(index), "fill": {"type": "FillStyle", "color": "white"}, "scale": 1.2} });

		}
	}

	// TODO, featureKey shouldn't be hardcoded
	if (selectionFeatures.includes(feature.get('@id'))) {
		style = ({ "fill": { "color": "#575FCF", "type": "FillStyle" }, "stroke": { "color": "#B1BFCD", "lineCap": "round", "lineJoin": "round", "miterLimit": 10, "type": "StrokeStyle", "width": 1 }, "text": { "type": "TextStyle", "text": "PMA", "fill": {"type": "FillStyle" ,"color": "white"}, "scale": 1.4} });
	}

	return style;
}

export function getBuildingSource() {
	return 'maps/GVA-center/buildings.geojson';
}

