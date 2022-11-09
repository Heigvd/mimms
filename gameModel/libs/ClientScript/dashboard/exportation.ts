import { FullEvent } from "../game/logic/EventManager";
import { EventPayload, HumanMeasureResultEvent, MeasureResultStatus } from "../game/logic/the_world";
import { getTagSystem } from "../game/logic/triage";
import { compare } from "../tools/helper";
import { exportLogger } from "../tools/logger";

type PlayerId = string;
type PatientId = string;
type TreatmentData = {type: string, time: number, blocks: string[]}
type MeasureData = {name: string, time: number, result: string, sourceEventId: number, status: MeasureResultStatus}

export async function exportAllPlayersDrillResults() : Promise<void>{

	const patientEvents = await getPatientsEvents();
	
	if(!patientEvents){
		exportLogger.error('Could not get patient info')
		return
	}

	//exportLogger.warn(patientEvents);

	//build a map per player and patient

	const playersCategories : Record<PlayerId, Record<PatientId, string>> = {}
	const playersAutoCat : Record<PlayerId, Record<PatientId, string>> = {};

	const playersMeasures : Record<PlayerId, Record<PatientId, MeasureData[]>> = {};
	const playersTreatments : Record<PlayerId, Record<PatientId, TreatmentData[]>> = {};

	const patientsIds : Record<PatientId, boolean> = {};

	const maxMeasures : Record<PatientId, number> = {};
	const maxTreatments : Record<PatientId, number> = {};

	const measureResultMap : Record<number, FullEvent<HumanMeasureResultEvent>> = {};

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
			case 'HumanMeasureResult':
				measureResultMap[evt.payload.sourceEventId] = evt as FullEvent<HumanMeasureResultEvent>;
		}


		if(ptid && plid){
			patientsIds[ptid] = true;

			switch(evt.payload.type){
				case 'Categorize':
					playersCategories[plid][ptid] = evt.payload.category;
					playersAutoCat[plid][ptid] = evt.payload.autoTriage.categoryId!;
					break;
				case 'HumanMeasure':
					const dataM : MeasureData = {
						time : evt.time,
						name : evt.payload.type,
						result : "NO RESULT",
						sourceEventId: evt.id,
						status : 'unknown'
					}
					if(evt.payload.source.type == 'act'){
						dataM.name = evt.payload.source.actId;
					}else {
						dataM.name = evt.payload.source.itemId;
					}
					// TODO result

					if(playersMeasures[plid][ptid]){
						playersMeasures[plid][ptid].push(dataM);
						maxMeasures[ptid]++;
					}else{
						playersMeasures[plid][ptid] = [dataM];
						maxMeasures[ptid] = 1;
					}

					break;
				case 'HumanTreatment':
					wlog('raw', evt.payload)
					const data : TreatmentData = {
						blocks : evt.payload.blocks,
						time: evt.time,
						type : evt.payload.type
					};
					if(evt.payload.source.type == 'act'){
						data.type = evt.payload.source.actId;
					}else {
						data.type = evt.payload.source.actionId;
					}

					if(playersTreatments[plid][ptid]){
						playersTreatments[plid][ptid].push(data)
						maxTreatments[ptid]++;
					}else{
						playersTreatments[plid][ptid] = [data]
						maxTreatments[ptid] = 1;
					}

					break;
			}
		}
	})

	const sortedPatientIds = Object.keys(patientsIds).sort((a,b) => compare(a,b));

	const systemName = getTagSystem();
	const lines : Record<PlayerId, string[]> = {};
	
	/**
	 * Each line has the following structure
	 * playerId, categorizationSystem, P1 data, ..., Pn data
	 * patient Pi structure
	 * correct_answer, given_answer, constant_parameters, treatmentsApplied (PiT1...PiTn), measuresDone(PiM1...PiMn)
	 * Measures structure
	 * type, status, startTime, duration, result
	 * Treatments structure
	 * type, status, startTime, duration, blocks
	 */

	const separator = '\t';
	let header : string[] = ['playerId', 'system_name'];

	const treatmentColumns = ['type', 'status', 'startTime', 'duration', 'blocks'];
	const measureColumns = ['type', 'status', 'startTime', 'duration', 'result'];
	sortedPatientIds.forEach(id => {

		appendHeader(id, 'correct_answer');
		appendHeader(id, 'given_answer');

		//TODO constant parameters headers

		//treatments header
		wlog(id, maxTreatments[id]);
		for(let t = 1; t <= maxTreatments[id]; t++){
			for(const h of treatmentColumns){
				appendHeader(id, 'T',t.toString(), h);
			}
		}

		//measures headers
		for(let m = 1; m <= maxMeasures[id]; m++){
			for(const h of measureColumns){
				appendHeader(id, 'M', m.toString(), h);
			}

		}
	});

	function appendHeader(patientId : PatientId, ...params: string []){
		header.push([patientId, ...params].join('_'));
	}
	
	//measures header

	
	Object.keys(playersAutoCat).forEach((pid) => {

		lines[pid] = [];
		lines[pid].push(pid);
		lines[pid].push(systemName);
		sortedPatientIds.forEach((patId: PatientId) => {
			addPatientData(pid, patId);
		})

	})

	function addPatientData(pid: PlayerId, patientId: PatientId){

		const line = lines[pid];
		//line.push(patientId);
		line.push(playersAutoCat[pid][patientId]); // correct answer
		line.push(playersCategories[pid][patientId]); // given answer

		// TODO patient vital parameters
		addPatientVitalParameters(pid, patientId);
		addTreatments(pid, patientId);
		addMeasures(pid, patientId);
	}

	function addTreatments(pid: PlayerId, patientId: PatientId){
		const line = lines[pid];
		const tdata = playersTreatments[pid][patientId];

		const status : MeasureResultStatus = 'success';
		const duration = (0).toString();

		if(tdata && maxTreatments[patientId] > 0){
			const max = maxTreatments[patientId];
			for(let i = 0; i < max; i++){
				const t = tdata[i];
				if(t){
					line.push(t.type);
					line.push(t.time.toString());
					line.push(status);
					line.push(duration);
					//wrong typing from serialization blocks is an object
					line.push(...Object.values(t.blocks))
				}else{
					//empty fill
					Array(treatmentColumns.length).forEach(() => line.push(''));
				}
			}
		}
	}

	function addMeasures(pid: PlayerId, patientId: PatientId){

		const line = lines[pid];
		const mdata = playersMeasures[pid][patientId];
		if(mdata && maxMeasures[patientId] > 0){
			const max = maxMeasures[patientId];
			for(let i = 0; i < max; i++){
				const m = mdata[i];
				if(m){
					// try to fetch the linked result event
					const resEvent = measureResultMap[m.sourceEventId];
					let duration = 0;
					if(resEvent){
						if(resEvent.payload.result){
							m.result = Object.values(resEvent.payload.result).map( v => v.value).join('|')//JSON.stringify(resEvent.payload.result);
						}
						m.status = resEvent.payload.status;
						duration = resEvent.payload.duration;
					}
					line.push(m.name);
					line.push(m.status);
					line.push(m.time.toString());
					line.push(duration.toString());
					line.push(m.result);
				}else{
					//empty fill
					Array(measureColumns.length).forEach(() => line.push(''));
				}
			}
		}
	}

	function addPatientVitalParameters(pid: string, patientId: string) {
		const line = lines[pid];
		//TODO
	}


	wlog('header', header); // TODO test
	//TODO export csv
	const result = header.join(separator) + '\n' + Object.values(lines).map(line => {
		return line.join(separator);
	}).join('\n');
	
	wlog(result);

	Helpers.downloadDataAsFile('drill.tsv', result);
}

export async function getPatientsEvents(): Promise<FullEvent<EventPayload>[]> {

	let info : FullEvent<EventPayload>[]= [];
	await APIMethods.runScript("PatientDashboard.patientInfo();", {}).then(response => {
		//dashboard = response.updatedEntities[0] as PatientDashboard;
		info = response.updatedEntities as FullEvent<EventPayload>[];
	})

	return info;

}


