
export const buildingLayer = Helpers.useRef<any>("buildingLayer",null);

export function setBuildingLayer(layer:any){
	buildingLayer.current = layer;
}
