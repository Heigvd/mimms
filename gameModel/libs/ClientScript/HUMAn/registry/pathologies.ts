import { allBlocks, extBlocks, NervousBlock, simpleFractureBonesBlocks } from "../../HUMAn/human";
import { buildPathology, PathologyDefinition } from "../../HUMAn/pathology";

let initialized = false;

let pathologies : Record<string, PathologyDefinition> = {};

function registerPathology(def: PathologyDefinition): void {
	pathologies[def.id] = def;
}

export function initPathologies(pathologySet : Record<string, PathologyDefinition>){
	wlog('init pathologies');
	if(initialized){
		return;
	}
	pathologies = pathologySet;
	initialized = true;

	const limbs: NervousBlock[] =
		["LEFT_SHOULDER", "LEFT_ARM", "LEFT_ELBOW", "LEFT_FOREARM", "LEFT_WRIST", "LEFT_HAND",
	"RIGHT_SHOULDER", "RIGHT_ARM", "RIGHT_ELBOW", "RIGHT_FOREARM", "RIGHT_WRIST", "RIGHT_HAND",
	"LEFT_THIGH", "LEFT_KNEE", "LEFT_LEG", "LEFT_ANKLE", "LEFT_FOOT",
	"RIGHT_THIGH", "RIGHT_KNEE", "RIGHT_LEG", "RIGHT_ANKLE", "RIGHT_FOOT"]

	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_ah',
				name: 'catastrophic arterial hemorrhage (thigh, neck)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.25, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
						'NECK'
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_ah__2',
				name: 'catastrophic arterial hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.85, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_ah',
				name: 'severe arterial hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.08, max: 0.25 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
						'NECK'
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_ah__2',
				name: 'severe arterial hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.17, max: 0.85 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'urgent_ah',
				severity: 'urgent',
				name: 'urgent arterial hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.06, max: 0.3 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_ARM',
						'RIGHT_ARM',
					],
				},
			],
		),
	);


	/*registerPathology(
		buildPathology(
			{
				id: 'minor_ah',
				severity: 'non_urgent',
				name: 'minor arterial hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'arterial',
					bleedingFactor: { min: 0.0001, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: extremities,
				},
			],
		),
	);*/


	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_vh_neck',
				name: 'catastrophic venous hemorrhage (neck)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.2, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'NECK',
					],
				},
			],
		),
	);


	// Venous
	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_vh',
				name: 'catastrophic venous hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.4, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
					],
				},
			],
		),
	);



	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_vh__2',
				name: 'catastrophic venous hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'dead'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.7, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_vh',
				name: 'severe venous hemorrhage (thigh)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.08, max: 0.24 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_THIGH',
						'RIGHT_THIGH',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_vh__2',
				name: 'severe venous hemorrhage (leg)',
				blockSelectionMode: 'any',
				severity: 'immediate'
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.2, max: 0.7 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_LEG',
						'RIGHT_LEG',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_vh_arm',
				name: 'severe venous hemorrhage',
				blockSelectionMode: 'any',
				severity: 'immediate',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.2, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_ARM',
						'RIGHT_ARM',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'urgent_vh',
				severity: 'urgent',
				name: 'moderate venous hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.06, max: 0.2 },
					instantaneousBloodLoss: undefined,
					blocks: [
						'LEFT_ARM',
						'RIGHT_ARM',
					],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'minor_vh',
				severity: 'non_urgent',
				name: 'minor venous hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.001, max: 0.1 },
					instantaneousBloodLoss: undefined,
					blocks: ['LEFT_FOREARM', 'RIGHT_FOREARM'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'minor_vh_face',
				severity: 'non_urgent',
				name: 'minor venous hemorrhage (face)',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					bleedingFactor: { min: 0.0001, max: 0.01 },
					instantaneousBloodLoss: undefined,
					blocks: ["HEAD"],
				},
			],
		),
	);

	// internal
	registerPathology(
		buildPathology(
			{
				id: 'catastrophic_ih',
				severity: 'dead',
				name: 'catastrophic internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.075, max: 1 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'severe_ih',
				severity: 'immediate',
				name: 'severe internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.0135, max: 0.075 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'urgent_ih',
				severity: 'urgent',
				name: 'urgent internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.0036, max: 0.0135 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'minor_ih',
				severity: 'non_urgent',
				name: 'minor internal hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Hemorrhage',
					subtype: 'internal',
					bleedingFactor: { min: 0.0001, max: 0.0036 },
					instantaneousBloodLoss: undefined,
					blocks: ['ABDOMEN'],
				},
			],
		),
	);

	/**
	 * Respiration
	 */

	/*registerPathology(
		buildPathology(
			{
				id: 'half_strangle',
				name: 'Strangulation 50%',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['NECK', 'HEAD'],
					airResistance: { min: 0.5, max: 0.5 },
					airResistanceDelta: undefined,
				},
			],
		),
	);*/

	/*registerPathology(
		buildPathology(
			{
				id: 'strangle',
				name: 'Strangle',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['NECK', 'HEAD'],
					airResistance: { min: 1, max: 1 },
					airResistanceDelta: undefined,
				},
			],
		),
	);*/

	/*registerPathology(
		buildPathology(
			{
				id: 'lung_r1_5pm',
				name: 'Bronch resistance:to 100%',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['BRONCHUS_1', 'BRONCHUS_2'],
					airResistanceDelta: { min: 0.05, max: 0.05 },
					airResistance: undefined,
				},
			],
		),
	);*/

	registerPathology(
		buildPathology(
			{
				id: 'upper_airways_burn',
				severity: 'urgent',
				name: 'Upper airways burn',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'AirwaysResistance',
					blocks: ['NECK'],
					airResistanceDelta: { min: 0.01, max: 0.1 },
					airResistance: undefined,
				},
				{
					type: 'Burn',
					blocks: ['HEAD'],
					level: '2',
					percent: { min: 0.25, max: 0.6 },
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'simple_pno_full',
				name: 'Simple pneumothorax',
				severity: 'non_urgent',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Pneumothorax',
					blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
					pneumothoraxType: 'SIMPLE',
					compliance: { min: 0, max: 1 },
					complianceDelta: undefined,
				},
				{
					type: 'Hemorrhage',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					subtype: 'venous',
					instantaneousBloodLoss: { min: 0, max: 60 },
					bleedingFactor: undefined,
				},
				{
					type: 'Fracture',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					fractureType: 'nonDisplaced',
				},
			],
			[
				[['UNIT_BRONCHUS_1'], ['THORAX_LEFT'], ['THORAX_LEFT']],
				[['UNIT_BRONCHUS_2'], ['THORAX_RIGHT'], ['THORAX_RIGHT']],
			],
		),
	);

/*
	registerPathology(
		buildPathology(
			{
				id: 'open_pno_full',
				name: 'Open pneumothorax full',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Pneumothorax',
					blocks: ['UNIT_BRONCHUS_1', 'UNIT_BRONCHUS_2'],
					pneumothoraxType: 'OPEN',
					compliance: { min: 0, max: 0 },
					complianceDelta: undefined,
				},
				{
					type: 'Hemorrhage',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					subtype: 'venous',
					instantaneousBloodLoss: { min: 100, max: 200 },
					bleedingFactor: undefined,
				},
				{
					type: 'Fracture',
					blocks: ['THORAX_LEFT', 'THORAX_RIGHT'],
					fractureType: 'displaced',
				},
			],
			[
				[['UNIT_BRONCHUS_1'], ['THORAX_LEFT'], ['THORAX_LEFT']],
				[['UNIT_BRONCHUS_2'], ['THORAX_RIGHT'], ['THORAX_RIGHT']],
			],
		),
	);*/

	registerPathology(
		buildPathology(
			{
				id: 'cranialTrauma',
				severity: 'immediate',
				name: 'cranial trauma with hemorrhage',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'ICM',
					blocks: ['HEAD'],
					delta_perMin: { min: 0.05, max: 10 },
					mass: undefined,
				},
				{
					type: 'Hemorrhage',
					subtype: 'venous',
					blocks: ['HEAD'],
					bleedingFactor: undefined,
					instantaneousBloodLoss: { min: 1, max: 150 },
				},
			],
		),
	);

	// Contusion
	registerPathology(
		buildPathology(
			{
				id: 'contusion',
				severity: 'non_urgent',
				name: 'contusion',
				blockSelectionMode: 'same',
			},
			[
				{
					type: 'Hematoma',
					blocks: [...extBlocks, "C1-C4", "C5-C7", "T1-T4", "T5-L4",],
				},
				{
					type: 'Pain',
					blocks: [...extBlocks, "C1-C4", "C5-C7", "T1-T4", "T5-L4",],
					pain: {min: 1, max: 10},
				},
			],
		),
	);

	// Contusion
	registerPathology(
		buildPathology(
			{
				id: 'unableToWalk',
				severity: 'non_urgent',
				name: 'unable to walk',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'UnableToWalk',
					blocks: [...allBlocks],
				},
			],
		),
	);

	// Burns
	registerPathology(
		buildPathology(
			{
				id: 'thorax_circ',
				severity: 'immediate',
				name: 'Circumferential Thorax Burn',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Burn',
					blocks: ['THORAX_LEFT'],
					level: '3',
					percent: { min: 1, max: 1 },
				},
				{
					type: 'Burn',
					blocks: ['THORAX_RIGHT'],
					level: '3',
					percent: { min: 1, max: 1 },
				},
			],
		),
	);

	/*registerPathology(
		buildPathology(
			{
				id: 'tamponade_slow',
				name: 'Tamponade Light',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Tamponade',
					blocks: ['HEART'],
					pericardial_deltaMin: { min: 0.1, max: 5 },
					pericardial_mL: undefined,
				},
			],
		),
	);*/

	/*registerPathology(
		buildPathology(
			{
				id: 'tamponade_mild',
				name: 'Tamponade Mild',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Tamponade',
					blocks: ['HEART'],
					pericardial_deltaMin: { min: 5, max: 25 },
					pericardial_mL: undefined,
				},
			],
		),
	);*/

	registerPathology(
		buildPathology(
			{
				id: 'tamponade_hard',
				severity: 'immediate',
				name: 'Tamponade',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Tamponade',
					blocks: ['HEART'],
					pericardial_deltaMin: { min: 0.1, max: 50 },
					pericardial_mL: undefined,
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_c1c2',
				severity: 'dead',
				name: 'Dislocation C1/C2',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: ['C1-C4'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_c5c7',
				severity: 'non_urgent',
				name: 'Dislocation C5/C7',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: ['C5-C7'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_t1l4',
				severity: 'non_urgent',
				name: 'Dislocation T1/T4',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: ['T1-T4'],
				},
			],
		),
	);

	registerPathology(
		buildPathology(
			{
				id: 'disclocation_limb',
				severity: 'non_urgent',
				name: 'Dislocation limb',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'NervousSystem',
					blocks: limbs,
				},
			],
		),
	);

	registerPathology(buildPathology({
		id: 'fracture_simple',
		severity: 'non_urgent',
		name: 'fracture non-displaced',
		blockSelectionMode: 'same',
	}, [
		{
			type: 'Fracture',
			blocks: [...simpleFractureBonesBlocks],
			fractureType: 'nonDisplaced',
		},
		{
			type: 'Hemorrhage',
			subtype: 'internal',
			blocks: [...simpleFractureBonesBlocks],
			bleedingFactor: {
				min: 0, max: 0.5
			},
			instantaneousBloodLoss: undefined,
		}
	]));

	registerPathology(buildPathology({
		id: 'fracture_displaced',
		name: 'fracture displaced',
		severity: 'non_urgent',
		blockSelectionMode: 'same',
	}, [
		{
			type: 'Fracture',
			blocks: [...simpleFractureBonesBlocks],
			fractureType: 'displaced',
		},
		{
			type: 'Hemorrhage',
			subtype: 'internal',
			blocks: [...simpleFractureBonesBlocks],
			bleedingFactor: {
				min: 0.5, max: 1
			},
			instantaneousBloodLoss: undefined,
		}
	]));

	registerPathology(buildPathology({
		id: 'fracture_open',
		severity: 'non_urgent',
		name: 'fracture open & displaced',
		blockSelectionMode: 'same',
	}, [
		{
			type: 'Fracture',
			blocks: [...simpleFractureBonesBlocks],
			fractureType: 'open',
		},
		{
			type: 'Hemorrhage',
			subtype: 'venous',
			blocks: [...simpleFractureBonesBlocks],
			bleedingFactor: {
				min: 0, max: 1
			},
			instantaneousBloodLoss: undefined,
		}
	]));

	registerPathology(
		buildPathology(
			{
				id: 'pain',
				severity: 'non_urgent',
				name: 'Pain',
				blockSelectionMode: 'any',
			},
			[
				{
					type: 'Pain',
					blocks: [...allBlocks],
					pain: {min: 1, max: 10}
				},
			],
		),
	);
}


