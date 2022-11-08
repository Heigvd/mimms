import { FullEvent } from "../game/logic/EventManager";
import { EventPayload } from "../game/logic/the_world";
import { Category, getTagSystem } from "../game/logic/triage";
import { exportLogger } from "../tools/logger";
import { getPatientDashboardInfo} from "./patient";

type PlayerId = string;
type PatientId = string;
type TreatmentData = {name: string, time: number, blocks: string[]}
type MeasureData = {name: string, time: number, result: string}

export async function exportAllPlayersDrillResults() : Promise<void>{

	const patientEvents = await getPatientsEvents();
	
	if(!patientEvents){
		exportLogger.error('Could not get patient info')
		return
	}

	//build a map per player and patient

	exportLogger.warn(patientEvents);

	const playersCategories : Record<PlayerId, Record<PatientId, string>> = {}
	const playersAutoCat : Record<PlayerId, Record<PatientId, string>> = {};

	const playersMeasures : Record<PlayerId, Record<PatientId, MeasureData[]>> = {};
	const playersTreatments : Record<PlayerId, Record<PatientId, TreatmentData[]>> = {};

	patientEvents.forEach( evt => {

		let plid = undefined, ptid = undefined;
		
		switch(evt.payload.type){
			case 'Categorize':
			case 'HumanMeasure':
			case 'HumanTreatment':
				plid = evt.payload.emitterPlayerId;
				ptid = evt.payload.targetId;
				if(!playersAutoCat[plid]){
					playersCategories[plid] = {};
					playersAutoCat[plid] = {};
					playersMeasures[plid] = {};
					playersTreatments[plid] = {};
				}
				break;
		}

		let maxMeasures = 0;
		let maxTreatments = 0;

		if(ptid && plid)
				switch(evt.payload.type){
			case 'Categorize':
				playersCategories[plid][ptid] = evt.payload.category;
				playersAutoCat[plid][ptid] = evt.payload.autoTriage.categoryId!;
				break;
			case 'HumanMeasure':
				const dataM : MeasureData = {
					time : evt.time,
					name : "",
					result : ""
				}
				if(evt.payload.source.type == 'act'){
					dataM.name = evt.payload.source.actId;
				}else {
					dataM.name = evt.payload.source.itemId;
				}
				// TODO result

				if(playersTreatments[plid][ptid]){
					playersMeasures[plid][ptid].push(dataM)
				}else{
					playersMeasures[plid][ptid] = [dataM]
				}

				if(playersMeasures[plid][ptid].length > maxMeasures){
					maxMeasures++;
				}

				break;
			case 'HumanTreatment':
				const data : TreatmentData = {
					blocks : evt.payload.blocks,
					time: evt.time,
					name : ''
				};
				if(evt.payload.source.type == 'act'){
					data.name = evt.payload.source.actId;
				}else {
					data.name = evt.payload.source.actionId;
				}

				if(playersTreatments[plid][ptid]){
					playersTreatments[plid][ptid].push(data)
				}else{
					playersTreatments[plid][ptid] = [data]
				}

				if(playersTreatments[plid][ptid].length > maxTreatments){
					maxTreatments++;
				}
				break;
		}
	})

	wlog(playersCategories);
	wlog(playersAutoCat);
	wlog(playersMeasures);
	wlog(playersTreatments);

	Object.values(playersMeasures).forEach((d) => {
		Object.values
	})

	const systemName = getTagSystem();
	const lines :string[] = [];
	Object.entries(playersAutoCat).forEach((pid,v) => {


	})
	
	//TODO export csv
}

export async function getPatientsEvents(): Promise<FullEvent<EventPayload>[]> {

	let info : FullEvent<EventPayload>[]= [];
	await APIMethods.runScript("PatientDashboard.patientInfo();", {}).then(response => {
		//dashboard = response.updatedEntities[0] as PatientDashboard;
		info = response.updatedEntities as FullEvent<EventPayload>[];
	})

	return info;

}