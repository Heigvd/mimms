import { initEmitterIds } from "./baseEvent";
import { sendEvents } from "./EventManager";

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
			pathologyId: 'full_ac',
			blocks: ['THORAX'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '1-2',
			pathologyId: 'semi_ac',
			blocks: ['LEFT_LEG'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '1-3',
			pathologyId: 'open_pno',
			blocks: ['UNIT_BRONCHUS_1'],
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
			pathologyId: 'tenth_vc',
			blocks: ['RIGHT_LEG'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-5',
			pathologyId: 'tenth_vc',
			blocks: ['RIGHT_FOREARM'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-6',
			pathologyId: '20p_vc',
			blocks: ['RIGHT_LEG'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-7',
			pathologyId: 'cityHunter',
			blocks: ['HEAD'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-8',
			pathologyId: 'tenth_vc',
			blocks: ['ABDOMEN'],
		},
		{
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-9',
			pathologyId: 'tenth_ih',
			blocks: ['ABDOMEN'],
		}, {
			...initEmitterIds(),
			type: 'HumanPathology',
			targetType: 'Human',
			targetId: '2-9',
			pathologyId: 'full_ac',
			blocks: ['THORAX'],
		}
	]);
}

