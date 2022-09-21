import { initEmitterIds } from './baseEvent';
import { sendEvent } from './EventManager';
import { checkUnreachable, normalize } from './helper';
import { BodyState, BodyStateKeys, computeState, Environnment, HumanBody, readKey } from './HUMAn/human';
import {
	ConsoleLog,
	getCurrentPatientBody,
	getCurrentPatientHealth,
	getHumanConsole,
	HumanHealth,
} from './the_world';
import { getEnv } from './WegasHelper';

type TriageFunction<T extends string> =
	| ((data: PreTriageData, console: ConsoleLog[]) => Omit<PreTriageResult<T>, 'severity'>)
	| undefined;

const SECONDARY_TRIAGE = 'sec_triage';
const INVOLVED = 'involved';
const NON_URGENT = 'non_urgent';
const URGENT = 'urgent';
const IMMEDIATE = 'immediate';
const ALMOST_DEAD = 'almost_dead';
const DEAD = 'dead';

type SAP_CATEGORY = typeof DEAD | typeof NON_URGENT | typeof URGENT;

type SAP2020_CATEGORY =
	| typeof DEAD
	| typeof ALMOST_DEAD
	| typeof IMMEDIATE
	| typeof URGENT
	| typeof NON_URGENT
	| typeof INVOLVED
	| typeof SECONDARY_TRIAGE;

type STANDARD_CATEGORY = typeof DEAD | typeof IMMEDIATE | typeof URGENT | typeof NON_URGENT;

type SACCO_CATEGORY =
	| 'zero'
	| 'one'
	| 'two'
	| 'three'
	| 'four'
	| 'five'
	| 'six'
	| 'seven'
	| 'eight'
	| 'nine'
	| 'ten'
	| 'eleven'
	| 'twelve';

export interface Category<
	T extends SAP_CATEGORY | SAP2020_CATEGORY | STANDARD_CATEGORY | SACCO_CATEGORY | string,
	> {
	id: T;
	bgColor: string;
	color: string;
	name: string;
	shouldBeHandledBy: 'ES' | 'POLICE';
	/** order of extraction/treatment */
	priority: number;
}

export type SystemName = 'SACCO' | 'CareFlight' | 'swissNew' | 'swissOld' | 'SIEVE' | 'START';

interface TagSystem<
	T extends SAP_CATEGORY | SAP2020_CATEGORY | STANDARD_CATEGORY | SACCO_CATEGORY | string,
	> {
	/** Sorted by severity (less severe first) ! */
	categories: Category<T>[];
}

export function getTagSystem(): SystemName {
	return Variable.find(gameModel, 'tagSystem').getValue(self) as SystemName;
}

const sapSystem: TagSystem<SAP_CATEGORY> = {
	categories: [
		{
			id: NON_URGENT,
			bgColor: 'orange',
			name: 'SAP',
			color: 'white',
			shouldBeHandledBy: 'ES',
			priority: 2,
		},
		{
			id: URGENT,
			bgColor: 'yellow',
			color: 'black',
			name: 'URGENT',
			shouldBeHandledBy: 'ES',
			priority: 1,
		},
		{
			id: DEAD,
			bgColor: 'black',
			color: 'white',
			name: 'DEAD',
			shouldBeHandledBy: 'ES',
			priority: 99,
		},
	],
};

const sap2System: TagSystem<SAP2020_CATEGORY> = {
	categories: [
		{
			id: SECONDARY_TRIAGE,
			bgColor: 'grey',
			name: 'DELAYED',
			color: 'white',
			shouldBeHandledBy: 'ES',
			priority: 4,
		},
		{
			id: INVOLVED,
			bgColor: 'white',
			color: 'black',
			name: 'INVOLVED',
			shouldBeHandledBy: 'ES',
			priority: 5,
		},
		{
			id: NON_URGENT,
			bgColor: '#3DB957',
			color: 'white',
			name: 'NON URGENT',
			shouldBeHandledBy: 'ES',
			priority: 3,
		},
		{
			id: URGENT,
			bgColor: 'yellow',
			color: 'black',
			name: 'URGENT',
			shouldBeHandledBy: 'ES',
			priority: 2,
		},
		{
			id: IMMEDIATE,
			bgColor: 'red',
			color: 'white',
			name: 'IMMEDIATE',
			shouldBeHandledBy: 'ES',
			priority: 1,
		},
		{
			id: ALMOST_DEAD,
			bgColor: 'blue',
			color: 'white',
			name: 'ALMOST DEAD',
			shouldBeHandledBy: 'POLICE',
			priority: 99,
		},
		{
			id: DEAD,
			bgColor: 'black',
			color: 'white',
			name: 'DEAD',
			shouldBeHandledBy: 'POLICE',
			priority: 98,
		},
	],
};

const sieveSystem: TagSystem<STANDARD_CATEGORY> = {
	categories: [
		{
			id: NON_URGENT,
			bgColor: 'green',
			color: 'white',
			name: 'P3',
			shouldBeHandledBy: 'ES',
			priority: 3,
		},
		{
			id: URGENT,
			bgColor: 'yellow',
			color: 'black',
			name: 'P2',
			shouldBeHandledBy: 'ES',
			priority: 2,
		},
		{
			id: IMMEDIATE,
			bgColor: 'red',
			color: 'white',
			name: 'P1',
			shouldBeHandledBy: 'ES',
			priority: 1,
		},
		{
			id: DEAD,
			bgColor: 'black',
			color: 'white',
			name: 'DEAD',
			shouldBeHandledBy: 'POLICE',
			priority: 99,
		},
	],
};

const startSystem: TagSystem<STANDARD_CATEGORY> = {
	categories: [
		{
			id: NON_URGENT,
			bgColor: 'green',
			color: 'white',
			name: 'MINOR',
			shouldBeHandledBy: 'ES',
			priority: 4,
		},
		{
			id: URGENT,
			bgColor: 'yellow',
			color: 'black',
			name: 'DELAYED',
			shouldBeHandledBy: 'ES',
			priority: 2,
		},
		{
			id: IMMEDIATE,
			bgColor: 'red',
			color: 'white',
			name: 'IMMEDIATE',
			shouldBeHandledBy: 'ES',
			priority: 1,
		},
		{
			id: DEAD,
			bgColor: 'black',
			color: 'white',
			name: 'EXPECTANT',
			shouldBeHandledBy: 'POLICE',
			priority: 99,
		},
	],
};

const careFlightSystem: TagSystem<STANDARD_CATEGORY> = {
	categories: [
		{
			id: NON_URGENT,
			bgColor: 'green',
			color: 'white',
			name: 'DELAYED',
			shouldBeHandledBy: 'ES',
			priority: 3,
		},
		{
			id: URGENT,
			bgColor: 'yellow',
			color: 'black',
			name: 'URGENT',
			shouldBeHandledBy: 'ES',
			priority: 2,
		},
		{
			id: IMMEDIATE,
			bgColor: 'red',
			color: 'white',
			name: 'IMMEDIATE',
			shouldBeHandledBy: 'ES',
			priority: 1,
		},
		{
			id: DEAD,
			bgColor: 'black',
			color: 'white',
			name: 'UNSALVAGEABLE',
			shouldBeHandledBy: 'POLICE',
			priority: 99,
		},
	],
};

const saccoSystem: TagSystem<SACCO_CATEGORY> = {
	categories: [
		{
			id: 'twelve',
			bgColor: 'white',
			color: 'black',
			name: '12',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'eleven',
			bgColor: 'white',
			color: 'black',
			name: '11',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'ten',
			bgColor: 'white',
			color: 'black',
			name: '10',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'nine',
			bgColor: 'white',
			color: 'black',
			name: '9',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'eight',
			bgColor: 'white',
			color: 'black',
			name: '8',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'seven',
			bgColor: 'white',
			color: 'black',
			name: '7',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'six',
			bgColor: 'white',
			color: 'black',
			name: '6',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'five',
			bgColor: 'white',
			color: 'black',
			name: '5',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'four',
			bgColor: 'white',
			color: 'black',
			name: '4',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'three',
			bgColor: 'white',
			color: 'black',
			name: '3',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'two',
			bgColor: 'white',
			color: 'black',
			name: '2',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'one',
			bgColor: 'white',
			color: 'black',
			name: '1',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
		{
			id: 'zero',
			bgColor: 'white',
			color: 'black',
			name: '0',
			shouldBeHandledBy: 'ES',
			priority: 0,
		},
	],
};
// 1h to clear:
// 4 5 6 3 2 7 1 8 9 10 11 12 0
const saccoFast: SACCO_CATEGORY[] = [
	'four',
	'five',
	'six',
	'three',
	'two',
	'seven',
	'one',
	'eight',
	'nine',
	'ten',
	'eleven',
	'twelve',
	'zero',
];

// up to 3h
// 5 6 7 8 4 9 3 2 1 10 11 12 0
const saccoMedium: SACCO_CATEGORY[] = [
	'five',
	'six',
	'seven',
	'eight',
	'four',
	'nine',
	'three',
	'two',
	'one',
	'ten',
	'eleven',
	'twelve',
	'zero',
];

// more than 3h
// 6 7 8 5 9 10 4 3 2 1 11 12 0
const saccoLong: SACCO_CATEGORY[] = [
	'six',
	'seven',
	'eight',
	'five',
	'nine',
	'ten',
	'four',
	'three',
	'two',
	'one',
	'eleven',
	'twelve',
	'zero',
];

export function getTagSystemCategories(): TagSystem<string> {
	const tagSystem = getTagSystem();
	switch (tagSystem) {
		case 'SIEVE':
			return sieveSystem;
		case 'START':
			return startSystem;
		case 'swissNew':
			return sap2System;
		case 'swissOld':
			return sapSystem;
		case 'SACCO':
			return saccoSystem;
		case 'CareFlight':
			return careFlightSystem;
	}
	checkUnreachable(tagSystem);
}

type PreTriageAction = string;

interface PreTriageData {
	human: HumanBody;
	env: Environnment;
	health: HumanHealth;
	actions: PreTriageAction[];
}

const explanations = {
	STILL_NOT_BREATHING: 'Still not breathing after airway clearance',
	BREATHES_AFTER_AIRWAYS_CLEARANCE: 'Breathes after airways clearance',
	INCOMPATIBLE_WITH_LIFE: 'Injuries incompatible with life',
	CAN_WALK: 'Can walk',
	RR_LT_10: 'RR < 10',
	RR_GT_30: 'RR > 30',
	INJURED: 'Injured',
	NOT_INJURED: 'Not injured',
	UNCONSCIOUS: 'Unconscious',
	HR_GT_120: 'HR > 120',
	CRT_GT_2: 'CRT > 2s',
	NO_RADIAL_PULSE: 'No radial pulse',
	MASSIVE_HEMORRHAGE: 'Massive hemorrhage',
	GCSM_LT_6: 'Glasgow Motor Response < 6',
	STRIDOR: 'Stridor',
	HIGH_PAIN: 'High plain (>=7)',
	HAEMOSTASIS: 'Haemostasis',
	CANNOT_WALK: 'Can not walk',
	CLEAR: 'Nothing detected',
	SACCO_RR_0: 'RR 0 => 0 point',
	SACCO_RR_1: 'RR 1-9 => 1 point',
	SACCO_RR_2: 'RR 36+ => 2 points',
	SACCO_RR_3: 'RR 25-35 => 3 points',
	SACCO_RR_4: 'RR 10-24 => 4 points',
	SACCO_HR_0: 'HR 0 => 0 point',
	SACCO_HR_1: 'HR 1-40 => 1 point',
	SACCO_HR_2: 'HR 41-60 => 2 points',
	SACCO_HR_3: 'HR 121+ => 3 points',
	SACCO_HR_4: 'HR 60-120 => 4 points',
	SACCO_GCS_0: 'No Motor response => 0 point',
	SACCO_GCS_1: 'Extension/Flexions => 1 point',
	SACCO_GCS_2: 'Withdraws => 2 points',
	SACCO_GCS_3: 'Localizes => 3 points',
	SACCO_GCS_4: 'Obeys commands => 4 points',
	SACCO_AGE_2: 'AGE 0-7 => 2 points',
	SACCO_AGE_1: 'AGE 8-14 => 1 point',
	SACCO_AGE_0: 'AGE 15-54 => 0 point',
	'SACCO_AGE_-2': 'AGE 55-74 => -2 points',
	'SACCO_AGE_-3': 'AGE 75+ => -3 points',
};

type Explanation = keyof typeof explanations;

export interface PreTriageResult<
	T extends SAP_CATEGORY | SAP2020_CATEGORY | STANDARD_CATEGORY | SACCO_CATEGORY | string,
	> {
	categoryId: T | undefined;
	severity: number;
	actions: PreTriageAction[];
	explanations: Explanation[];
}

function isInjured(data: PreTriageData) {
	return data.health.pathologies.length > 0;
}

function healHemorrhages(data: PreTriageData) {
	data.actions.push('Try to stop massive hemorrhage');
}

function clearAirways(data: PreTriageData) {
	data.actions.push('LVAS');
}

function runOneStep({ human, env, health }: PreTriageData): void {
	const stepDuration = Variable.find(gameModel, 'stepDuration').getValue(self);

	const meta = human.meta;

	const newState = Helpers.cloneDeep(human.state);

	computeState(newState, meta, env, stepDuration, health.pathologies, health.effects);
}

function isUnconscious(data: PreTriageData) {
	return data.human.state.vitals.glasgow.total < 11;
}

function notCompatibleWithLife(data: PreTriageData) {
	// TODO:
	return false;
}

function placeInRecoveryPosition(data: PreTriageData) {
	data.actions.push('RecoveryPosition');
}

function massiveHemorrhage({ human }: PreTriageData) {
	return human.state.vitals.cardio.extLossesFlow_mlPerMin > 10;
}

function getOrReadMetric<T>(
	metric: BodyStateKeys,
	humanState: BodyState,
	console: ConsoleLog[],
	mostRecent: 'OLDEST' | 'MOST_RECENT',
): T {
	// try to re-use measure from console
	const theConsole = mostRecent === 'MOST_RECENT' ? [...console].reverse() : console;

	for (const log of theConsole) {
		if (log.type === 'MeasureLog') {
			for (const m of log.metrics) {
				if (m.metric === metric) {
					wlog(`Fetch measure ${metric} from console: ${m.value}`);
					return m.value as T;
				}
			}
		}
	}

	// fallback
	const value = readKey(humanState, metric) as T;
	wlog(`Metric not found in console: read ${metric} from body: ${value}`);
	return value;
}

const doSapPreTriage: TriageFunction<SAP_CATEGORY> = (data, console) => {
	const { human, actions } = data;

	if (human.state.vitals.canWalk) {
		actions.push('Goto PMA');
		return {
			categoryId: NON_URGENT,
			explanations: ['CAN_WALK'],
			actions,
		};
	}

	if (getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'OLDEST') === 0) {
		clearAirways(data);
		runOneStep(data);
	}

	const rr = getOrReadMetric<number>(
		'vitals.respiration.rr',
		data.human.state,
		console,
		'MOST_RECENT',
	);

	if (rr === 0) {
		return {
			categoryId: DEAD,
			explanations: ['STILL_NOT_BREATHING'],
			actions,
		};
	}

	if (massiveHemorrhage(data)) {
		healHemorrhages(data);
	}

	if (rr < 10) {
		return {
			categoryId: URGENT,
			explanations: ['RR_LT_10'],
			actions,
		};
	}

	if (rr > 30) {
		return {
			categoryId: URGENT,
			explanations: ['RR_GT_30'],
			actions,
		};
	}

	if (
		!getOrReadMetric<boolean>('vitals.cardio.radialPulse', data.human.state, console, 'MOST_RECENT')
	) {
		return {
			categoryId: URGENT,
			explanations: ['NO_RADIAL_PULSE'],
			actions,
		};
	}

	if (getOrReadMetric<number>('vitals.cardio.hr', data.human.state, console, 'MOST_RECENT') > 120) {
		return {
			categoryId: URGENT,
			explanations: ['HR_GT_120'],
			actions,
		};
	}

	if (
		getOrReadMetric<number>(
			'vitals.capillaryRefillTime_s',
			data.human.state,
			console,
			'MOST_RECENT',
		) > 2
	) {
		return {
			categoryId: URGENT,
			explanations: ['CRT_GT_2'],
			actions,
		};
	}

	if (massiveHemorrhage(data)) {
		return {
			categoryId: URGENT,
			explanations: ['MASSIVE_HEMORRHAGE'],
			actions,
		};
	}

	if (
		getOrReadMetric<number>('vitals.glasgow.motor', data.human.state, console, 'MOST_RECENT') < 6
	) {
		return {
			categoryId: URGENT,
			explanations: ['GCSM_LT_6'],
			actions,
		};
	}

	return {
		categoryId: NON_URGENT,
		explanations: ['CLEAR'],
		actions,
	};
};

const doCareFlightPreTriage: TriageFunction<STANDARD_CATEGORY> = (data, console) => {
	const { actions } = data;

	if (getOrReadMetric<boolean>('vitals.canWalk', data.human.state, console, 'MOST_RECENT')) {
		actions.push('Goto PMA');
		return {
			categoryId: 'non_urgent',
			explanations: ['CAN_WALK'],
			actions,
		};
	}

	// OBEYS COMMANDS?
	if (
		getOrReadMetric<number>('vitals.glasgow.motor', data.human.state, console, 'MOST_RECENT') < 6
	) {
		// NO

		// BREATHES WITH OPEN AIRWAYS?
		if (
			getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'OLDEST') == 0
		) {
			clearAirways(data);
			runOneStep(data);
		}

		const rr = getOrReadMetric<number>(
			'vitals.respiration.rr',
			data.human.state,
			console,
			'MOST_RECENT',
		);

		if (rr === 0) {
			// DO NOT
			return {
				categoryId: DEAD,
				explanations: ['STILL_NOT_BREATHING'],
				actions,
			};
		} else {
			// DO
			return {
				categoryId: IMMEDIATE,
				explanations: ['BREATHES_AFTER_AIRWAYS_CLEARANCE'],
				actions,
			};
		}
	} else {
		// OBEYS COMMAND!
		if (
			getOrReadMetric<boolean>(
				'vitals.cardio.radialPulse',
				data.human.state,
				console,
				'MOST_RECENT',
			)
		) {
			return {
				categoryId: URGENT,
				explanations: ['CANNOT_WALK'],
				actions,
			};
		} else {
			return {
				categoryId: IMMEDIATE,
				explanations: ['NO_RADIAL_PULSE'],
				actions,
			};
		}
	}
};

const doSievePreTriage: TriageFunction<STANDARD_CATEGORY> = (data, console) => {
	const { actions } = data;

	if (massiveHemorrhage(data)) {
		healHemorrhages(data);
		return {
			categoryId: 'immediate',
			explanations: ['MASSIVE_HEMORRHAGE'],
			actions,
		};
	}

	if (!isInjured(data)) {
		return {
			categoryId: undefined,
			explanations: ['NOT_INJURED'],
			actions,
		};
	}

	if (getOrReadMetric<boolean>('vitals.canWalk', data.human.state, console, 'MOST_RECENT')) {
		return {
			categoryId: 'non_urgent',
			explanations: ['CAN_WALK'],
			actions,
		};
	}

	// BREATHES WITH OPEN AIRWAYS?
	if (getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'OLDEST') === 0) {
		clearAirways(data);
		runOneStep(data);
	}

	const rr = getOrReadMetric<number>(
		'vitals.respiration.rr',
		data.human.state,
		console,
		'MOST_RECENT',
	);

	if (rr === 0) {
		// DO NOT
		return {
			categoryId: DEAD,
			explanations: ['STILL_NOT_BREATHING'],
			actions,
		};
	}

	if (isUnconscious(data)) {
		placeInRecoveryPosition(data);
		return {
			categoryId: 'immediate',
			explanations: ['UNCONSCIOUS'],
			actions,
		};
	}

	if (rr < 10) {
		return {
			categoryId: 'immediate',
			explanations: ['RR_LT_10'],
			actions,
		};
	}

	if (rr > 30) {
		return {
			categoryId: 'immediate',
			explanations: ['RR_GT_30'],
			actions,
		};
	}

	if (getOrReadMetric<number>('vitals.cardio.hr', data.human.state, console, 'MOST_RECENT') > 120) {
		return {
			categoryId: 'immediate',
			explanations: ['HR_GT_120'],
			actions,
		};
	}

	if (
		getOrReadMetric<number>(
			'vitals.capillaryRefillTime_s',
			data.human.state,
			console,
			'MOST_RECENT',
		) > 2
	) {
		return {
			categoryId: 'immediate',
			explanations: ['CRT_GT_2'],
			actions,
		};
	}

	return {
		categoryId: URGENT,
		explanations: ['CANNOT_WALK'],
		actions,
	};
};

type SaccoScore = 0 | 1 | 2 | 3 | 4;
const doSaccoPreTriage: TriageFunction<SACCO_CATEGORY> = (data, console) => {
	const { human, actions } = data;
	let rrScore: SaccoScore = 0;
	let hrScore: SaccoScore = 0;
	let gcsScore: SaccoScore = 0;
	let ageScore: 2 | 1 | 0 | -2 | -3 = 0;

	const rr = getOrReadMetric<number>(
		'vitals.respiration.rr',
		data.human.state,
		console,
		'MOST_RECENT',
	);

	if (rr <= 0) {
		rrScore = 0;
	} else if (rr <= 9) {
		rrScore = 1;
	} else if (rr <= 24) {
		rrScore = 4;
	} else if (rr <= 35) {
		rrScore = 3;
	} else {
		rrScore = 2;
	}

	const hr = getOrReadMetric<number>('vitals.cardio.hr', data.human.state, console, 'MOST_RECENT');

	if (hr <= 0) {
		hrScore = 0;
	} else if (hr <= 40) {
		hrScore = 1;
	} else if (hr <= 60) {
		hrScore = 2;
	} else if (hr <= 120) {
		hrScore = 4;
	} else {
		hrScore = 3;
	}

	const glasgow_motor = getOrReadMetric<number>(
		'vitals.glasgow.motor',
		data.human.state,
		console,
		'MOST_RECENT',
	);
	if (glasgow_motor === 6) {
		gcsScore = 4;
	} else if (glasgow_motor === 5) {
		gcsScore = 3;
	} else if (glasgow_motor === 4) {
		gcsScore = 2;
	} else if (glasgow_motor > 1) {
		gcsScore = 1;
	}

	const age = human.meta.age;
	if (age <= 7) {
		ageScore = 2;
	} else if (age <= 14) {
		ageScore = 1;
	} else if (age <= 54) {
		ageScore = 0;
	} else if (age <= 74) {
		ageScore = -2;
	} else {
		ageScore = -3;
	}

	const score = normalize(hrScore + rrScore + gcsScore + ageScore, { min: 0, max: 12 });

	return {
		categoryId: saccoSystem.categories[12 - score]!.id,
		explanations: [
			`SACCO_RR_${rrScore}`,
			`SACCO_HR_${hrScore}`,
			`SACCO_GCS_${gcsScore}`,
			`SACCO_AGE_${ageScore}`,
		],
		actions,
	};
};

const doStartPreTriage: TriageFunction<STANDARD_CATEGORY> = (data, console) => {
	const { actions } = data;

	if (getOrReadMetric<boolean>('vitals.canWalk', data.human.state, console, 'MOST_RECENT')) {
		actions.push('Goto PMA');
		return {
			categoryId: NON_URGENT,
			explanations: ['CAN_WALK'],
			actions,
		};
	}

	if (getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'OLDEST') === 0) {
		clearAirways(data);
		runOneStep(data);

		if (
			getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'MOST_RECENT') > 0
		) {
			return {
				categoryId: IMMEDIATE,
				explanations: ['BREATHES_AFTER_AIRWAYS_CLEARANCE'],
				actions,
			};
		} else {
			return {
				categoryId: DEAD,
				explanations: ['STILL_NOT_BREATHING'],
				actions,
			};
		}
	}

	if (
		getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'MOST_RECENT') > 30
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['RR_GT_30'],
			actions,
		};
	}

	if (
		!getOrReadMetric<boolean>('vitals.cardio.radialPulse', data.human.state, console, 'MOST_RECENT')
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['NO_RADIAL_PULSE'],
			actions,
		};
	}

	if (
		getOrReadMetric<boolean>(
			'vitals.capillaryRefillTime_s',
			data.human.state,
			console,
			'MOST_RECENT',
		)
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['CRT_GT_2'],
			actions,
		};
	}

	if (
		getOrReadMetric<number>('vitals.glasgow.motor', data.human.state, console, 'MOST_RECENT') < 6
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['GCSM_LT_6'],
			actions,
		};
	}

	return {
		categoryId: URGENT,
		explanations: ['CANNOT_WALK'],
		actions,
	};
};

const doSwissPreTriage: TriageFunction<SAP2020_CATEGORY> = (data, console) => {
	const { actions } = data;

	if (getOrReadMetric<boolean>('vitals.canWalk', data.human.state, console, 'MOST_RECENT')) {
		actions.push('Goto PMA');
		return {
			categoryId: 'sec_triage',
			explanations: ['CAN_WALK'],
			actions,
		};
	}

	if (getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'OLDEST') === 0) {
		clearAirways(data);
		runOneStep(data);

		if (
			getOrReadMetric<number>('vitals.respiration.rr', data.human.state, console, 'MOST_RECENT') ===
			0
		) {
			return {
				categoryId: DEAD,
				explanations: ['STILL_NOT_BREATHING'],
				actions,
			};
		}
	}

	if (notCompatibleWithLife(data)) {
		return {
			categoryId: DEAD,
			explanations: ['INCOMPATIBLE_WITH_LIFE'],
			actions,
		};
	}

	if (isUnconscious(data)) {
		placeInRecoveryPosition(data);
	}

	let healedHemorrhage = false;
	if (massiveHemorrhage(data)) {
		healHemorrhages(data);
		healedHemorrhage = true;
		if (massiveHemorrhage(data)) {
			return {
				categoryId: IMMEDIATE,
				explanations: ['MASSIVE_HEMORRHAGE'],
				actions,
			};
		}
	}

	if (
		getOrReadMetric<number>('vitals.respiration.stridor', data.human.state, console, 'MOST_RECENT')
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['STRIDOR'],
			actions,
		};
	}

	// TODO
	// MANUAL UPPER AIRWAYS MAINTENANCE?

	const rr = getOrReadMetric<number>(
		'vitals.respiration.rr',
		data.human.state,
		console,
		'MOST_RECENT',
	);
	if (rr > 30) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['RR_GT_30'],
			actions,
		};
	}

	if (rr < 10) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['RR_LT_10'],
			actions,
		};
	}

	if (
		!getOrReadMetric<boolean>('vitals.cardio.radialPulse', data.human.state, console, 'MOST_RECENT')
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['NO_RADIAL_PULSE'],
			actions,
		};
	}

	if (
		getOrReadMetric<number>(
			'vitals.capillaryRefillTime_s',
			data.human.state,
			console,
			'MOST_RECENT',
		) > 2
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['CRT_GT_2'],
			actions,
		};
	}

	if (
		getOrReadMetric<number>('vitals.glasgow.motor', data.human.state, console, 'MOST_RECENT') < 6
	) {
		return {
			categoryId: IMMEDIATE,
			explanations: ['GCSM_LT_6'],
			actions,
		};
	}

	if (getOrReadMetric<number>('vitals.pain', data.human.state, console, 'MOST_RECENT') > 7) {
		return {
			categoryId: URGENT,
			explanations: ['HIGH_PAIN'],
			actions,
		};
	}

	if (!getOrReadMetric<boolean>('vitals.canWalk', data.human.state, console, 'MOST_RECENT')) {
		return {
			categoryId: URGENT,
			explanations: ['CANNOT_WALK'],
			actions,
		};
	}

	if (healedHemorrhage) {
		return {
			categoryId: URGENT,
			explanations: ['HAEMOSTASIS'],
			actions,
		};
	}

	if (isInjured(data)) {
		return {
			categoryId: NON_URGENT,
			explanations: ['INJURED'],
			actions,
		};
	}

	return {
		categoryId: INVOLVED,
		explanations: ['NOT_INJURED'],
		actions,
	};
};

export function doAutomaticTriage(): PreTriageResult<string> | undefined {
	const tagSystem = getTagSystem();

	const human = getCurrentPatientBody();
	const health = getCurrentPatientHealth();

	const id = I18n.toString(Variable.find(gameModel, 'currentPatient'));

	const console = getHumanConsole(id).sort((a, b) => a.time - b.time);

	const env = getEnv();

	if (human == null || health == null) {
		return undefined;
	}

	const data: PreTriageData = {
		human: {
			state: human.state,
			meta: human.meta,
		},
		env: env,
		health: health,
		actions: [],
	};

	let triageFunction: TriageFunction<string> = undefined;
	switch (tagSystem) {
		case 'SIEVE':
			triageFunction = doSievePreTriage;
			break;
		case 'START':
			triageFunction = doStartPreTriage;
			break;
		case 'swissNew':
			triageFunction = doSwissPreTriage;
			break;
		case 'swissOld':
			triageFunction = doSapPreTriage;
			break;
		case 'SACCO':
			triageFunction = doSaccoPreTriage;
			break;
		case 'CareFlight':
			triageFunction = doCareFlightPreTriage;
			break;
		default:
			checkUnreachable(tagSystem);
	}

	if (triageFunction != null) {
		const result = triageFunction(data, console);
		result.categoryId;
		const severity = (getTagSystemCategories().categories).findIndex((c) => {
			return c.id === result.categoryId
		});
		return {
			...result,
			severity
		};
	} else {
		// not yet implemented
	}
}

export function getCategory(category: string | undefined): { category: Category<string>, severity: number } | undefined {
	const categories = getTagSystemCategories();
	if (categories != null) {
		const index = categories.categories.findIndex(c => c.id === category);
		if (index >= 0) {
			return {
				category: categories.categories[index]!,
				severity: index
			}
		}
	}
}

export function doAutomaticTriageAndLogToConsole() {
	const tagSystem = getTagSystem();
	const result = doAutomaticTriage();

	const patientId = I18n.toString(Variable.find(gameModel, 'currentPatient'));

	if (result != null) {
		const message = resultToHtml(result);

		sendEvent({
			...initEmitterIds(),
			type: 'HumanLogMessage',
			targetType: 'Human',
			targetId: patientId,
			message: message,
		});

		//wlog("PreTriage: " + message);
		/*setState(state => {
			return { ...state, logs: [...state.logs, output.join("")] };
		});*/
	} else {
		wlog(`PreTriage "${tagSystem}": Not Yet Implements]`);

		sendEvent({
			...initEmitterIds(),
			type: 'HumanLogMessage',
			targetType: 'Human',
			targetId: patientId,
			message: `PreTriage "${tagSystem}": Not Yet Implemented`,
		});
	}
}

export function resultToHtml(result: PreTriageResult<string>) {
	const tagSystem = getTagSystem();

	const sCategory = getCategory(result.categoryId);
	const output: string[] = [`<h3>PreTriage ${tagSystem}</h3>`];
	if (sCategory) {
		const {category} = sCategory;
		output.push(
			`<div class='tagCategory' style="color: ${category.color}; background-color: ${category.bgColor}">${category.name}</div>`,
		);
	} else {
		output.push(`Error: unresolved category: ${result.categoryId}`);
	}
	output.push('<div>');
	if (result.explanations.length > 0) {
		output.push('<strong>Because:</strong>');
		output.push('<ul>');
		output.push(...result.explanations.map(exp => `<li>${explanations[exp]}</li>`));
		output.push('</ul>');
	} else {
		output.push('<strong>No Explanation ¯_(ツ)_/¯</strong>');
	}
	output.push('</div>');

	output.push('<div>');
	if (result.actions.length > 0) {
		output.push('<strong>Action(s) taken:</strong>');
		output.push('<ul>');
		output.push(...result.actions.map(action => `<li>${action}</li>`));
		output.push('</ul>');
	} else {
		output.push('<strong>No action taken</strong>');
	}
	output.push('</div>');

	return output.join('');
}
