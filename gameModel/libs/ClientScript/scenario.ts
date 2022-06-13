import { initEmitterIds } from "./baseEvent";
import { sendEvents } from "./EventManager";
import { afflictPathology } from "./pathology";

export function premiereVague() {

	sendEvents([
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '1-1',
			location: {
				mapId: 'the_world',
				x: 180,
				y: 180,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '1-2',
			location: {
				mapId: 'the_world',
				x: 240,
				y: 180,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '1-3',
			location: {
				mapId: 'the_world',
				x: 280,
				y: 180,
			}
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '1-1',
			pathologyId: 'full_ah',
			afflictedBlocks: ['THORAX'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 1
			}]
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '1-2',
			pathologyId: 'semi_ah',
			afflictedBlocks: ['LEFT_LEG'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 0.5
			}]
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '1-3',
			pathologyId: 'open_pno_full',
			afflictedBlocks: ['UNIT_BRONCHUS_1', 'THORAX', 'THORAX'],
			modulesArguments: [
				{
					type: 'PneumothoraxArgs',
					compliance: 0,
				},
				{
					type: 'HemorrhageArgs',
					instantaneousBloodLoss: 150,
				},
				{
					type: 'NoArgs',
				},
			]
		}
	]);
}




export function deuxiemeVague() {

	sendEvents([
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-4',
			location: {
				mapId: 'the_world',
				x: 170,
				y: 215,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-5',
			location: {
				mapId: 'the_world',
				x: 210,
				y: 215,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-6',
			location: {
				mapId: 'the_world',
				x: 250,
				y: 215,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-7',
			location: {
				mapId: 'the_world',
				x: 290,
				y: 215,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-8',
			location: {
				mapId: 'the_world',
				x: 330,
				y: 215,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-9',
			location: {
				mapId: 'the_world',
				x: 170,
				y: 250,
			}
		},
		{
			...initEmitterIds(),
			type: 'Teleport',
			targetType: 'Human',
			targetId: '2-10',
			location: {
				mapId: 'the_world',
				x: 210,
				y: 250,
			}
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-4',
			pathologyId: 'tenth_vh',
			afflictedBlocks: ['RIGHT_LEG'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 0.1,
			}],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-5',
			pathologyId: 'tenth_vh',
			afflictedBlocks: ['RIGHT_FOREARM'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 0.1,
			}],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-6',
			pathologyId: '20p_vh',
			afflictedBlocks: ['RIGHT_LEG'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 0.2,
			}],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-7',
			pathologyId: 'cityHunter',
			afflictedBlocks: ['HEAD'],
			modulesArguments: [{
				type: 'ICPArgs',
				delta_perMin: 1
			}]
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-8',
			pathologyId: 'tenth_vh',
			afflictedBlocks: ['ABDOMEN'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 0.1,
			}],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-9',
			pathologyId: 'simple_pno_full',
			afflictedBlocks: ['UNIT_BRONCHUS_1', 'THORAX', 'THORAX'],
			modulesArguments: [{
				type: 'PneumothoraxArgs',
				compliance: 0,
			}, {
				type: 'HemorrhageArgs',
				instantaneousBloodLoss: 50,
			}, {
				type: 'NoArgs'
			}]
		}, {
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-10',
			pathologyId: 'full_ah',
			afflictedBlocks: ['THORAX'],
			modulesArguments: [{
				type: 'HemorrhageArgs',
				bleedingFactor: 1,
			}],
		}
	]);
}

