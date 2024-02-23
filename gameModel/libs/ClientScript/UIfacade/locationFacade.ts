import { FixedMapEntity } from "../game/common/events/defineMapObjectEvent";
import { getAvailableLocations } from "../game/common/simulationState/locationState";
import { getAllActors } from "../UIfacade/actorFacade";


export function getAvailableLocationsFacade(): FixedMapEntity[] {
	return getAvailableLocations();

}

export function getAvailableLocationsOnMapNameReplacedByActorIfAvailable(): {label:string, value: string}[] {
	const allActors = getAllActors();

	const selectValues:{label:string, value: string}[] = [];

	getAvailableLocations().map(mapLocation => {
		const actorForLocation = allActors.filter(actor => actor.getComputedSymbolicLocation() === mapLocation.id);
		if (actorForLocation.length > 0){
			//should be one...
			selectValues.push({label: actorForLocation[0].ShortName, value: "" + mapLocation.id});
		}
		else 
			selectValues.push({label: mapLocation.id, value: "" + mapLocation.id});
	});
	return selectValues;
}



