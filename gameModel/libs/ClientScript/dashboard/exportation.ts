import { FullEvent } from "../game/common/events/eventUtils";
import { EventPayload, HumanMeasureResultEvent, MeasureResultStatus } from "../game/common/events/eventTypes";
import { getTagSystem } from "../game/pretri/triage";
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

	const playersCategories : Record<PlayerId, Record<PatientId, string>> = {};
	const playersAutoCat : Record<PlayerId, Record<PatientId, string>> = {};
	const playersCatVitals : Record<PlayerId, Record<PatientId, Record <string, string | number>>> = {};
	
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
					playersCatVitals[plid] = {};
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
					playersCatVitals[plid][ptid] = evt.payload.autoTriage.vitals;
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

					if(playersMeasures[plid][ptid]){
						playersMeasures[plid][ptid].push(dataM);
						maxMeasures[ptid]++;
					}else{
						playersMeasures[plid][ptid] = [dataM];
						maxMeasures[ptid] = 1;
					}

					break;
				case 'HumanTreatment':
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
	let header : string[] = ['playerId', 'playerName', 'system_name'];

	const treatmentColumns = ['type', 'status', 'startTime', 'duration', 'blocks'];
	const measureColumns = ['type', 'status', 'startTime', 'duration', 'result'];

	let vitalsExists : Record<PatientId, number> = {};

	sortedPatientIds.forEach(id => {

		appendHeader(id, 'correct_answer');
		appendHeader(id, 'given_answer');

		// patient vitals header
		// find player that has categorized this patient
		const vitals = Object.values(playersCatVitals).find(entry => entry[id] !== undefined);
		if(vitals){
			const keys = Object.keys(vitals[id]);
			vitalsExists[id] = keys.length;
			for(const vitalName of keys){
				appendHeader(id, vitalName);
			}
		}

		// treatments header
		for(let t = 1; t <= maxTreatments[id]; t++){
			for(const h of treatmentColumns){
				appendHeader(id, 'T',t.toString(), h);
			}
		}

		// measures headers
		for(let m = 1; m <= maxMeasures[id]; m++){
			for(const h of measureColumns){
				appendHeader(id, 'M', m.toString(), h);
			}

		}
	});

	function appendHeader(patientId : PatientId, ...params: string []){
		header.push([patientId, ...params].join('_'));
	}

	// build pid to player name map
	const players = await APIMethods.runScript(`MimmsHelper.getPlayers()`, {});
	const playerNames : Record<string, string>= {};

	players.updatedEntities.forEach((v: any) => {
		playerNames[v.id] = v.name;
	});

	Object.keys(playersAutoCat).forEach((pid) => {

		lines[pid] = [];
		lines[pid].push(pid);
		lines[pid].push(playerNames[pid]);
		lines[pid].push(systemName);
		sortedPatientIds.forEach((patId: PatientId) => {
			addPatientData(pid, patId);
		})

	})

	function addPatientData(pid: PlayerId, patientId: PatientId){

		const line = lines[pid];
		line.push(playersAutoCat[pid][patientId] || 'NOT CATEGORIZED'); // correct answer
		line.push(playersCategories[pid][patientId] || 'NOT CATEGORIZED'); // given answer

		if(vitalsExists[patientId]){
			addPatientVitalParameters(pid, patientId);
		}
		addTreatments(pid, patientId);
		addMeasures(pid, patientId);
	}

	function addTreatments(pid: PlayerId, patientId: PatientId){
		const line = lines[pid];
		const tdata = playersTreatments[pid][patientId];

		const status : MeasureResultStatus = 'success';
		const duration = (0).toString();

		const max = maxTreatments[patientId] || 0;
		for(let i = 0; i < max; i++){
			const t = tdata ? tdata[i] : undefined;
			if(t){
				line.push(t.type);
				line.push(status);
				line.push(t.time.toString());
				line.push(duration);
				//wrong typing from serialization blocks is an object
				const blocks = Object.values(t.blocks);
				if(blocks.length){
					line.push(blocks.join('|'));
				}else {
					line.push('N/A');
				}
			}else{
				//empty fill
				line.push(...Array(treatmentColumns.length).fill(''));
			}
		}
	}

	function addMeasures(pid: PlayerId, patientId: PatientId){

		const line = lines[pid];
		const mdata = playersMeasures[pid][patientId];
		const max = maxMeasures[patientId] || 0;
		for(let i = 0; i < max; i++){
			const m = mdata ? mdata[i] : undefined;
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
				line.push(...Array(measureColumns.length).fill(''));
			}
		}
	}

	function addPatientVitalParameters(pid: PlayerId, patientId: PatientId) {
		const line = lines[pid];

		const vitals = playersCatVitals[pid][patientId];
		if(vitals){
			Object.values(vitals).forEach(v => line.push(v.toString()));
		}else{
			const nEmpty = vitalsExists[patientId];
			line.push(...Array(nEmpty).fill(''));
		}
	}

	const result = header.join(separator) + '\n' + Object.values(lines).map(line => {
		return line.join(separator);
	}).join('\n');
	
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


