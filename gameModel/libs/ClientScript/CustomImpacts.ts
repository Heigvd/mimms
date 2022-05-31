import { getBlocksSelector } from "./GameModelerHelper";
import { getItems, getPathologies } from "./registries";
import { getPatientAsChoices } from "./WegasHelper";

Helpers.registerEffect(() => {

	const humanSelector = {
		type: 'string',
		required: true,
		view: {
			label: 'Human',
			type: 'select',
			choices: getPatientAsChoices(true),
		}
	};

	const moveableObjectSelector = {
		type: 'object',
		required: true,
		view: {
			label: 'Human',
			type: 'select',
			choices: getPatientAsChoices(true).map(opt => ({
				label: `Human: ${opt.label}`,
				value: {
					objectType: 'Human',
					objectId: opt.value
				}
			})),
		}
	}

	const pathologiesChoices = {
		type: 'string',
		required: true,
		view: {
			label: 'Pathology',
			type: 'select',
			choices: getPathologies(),
		}
	}

	const blocksSelector = getBlocksSelector();

	const allItems = getItems();

	const itemChoices = allItems.flatMap(({ id, item }) => {
		return Object.entries(item.actions)
			.map(([actionId, action]) => ({
				label: `${item.name} / ${action.name}`,
				value: {
					itemId: id,
					actionId: actionId,
				}
			}))
	});

	const itemSelector = {
		type: 'object',
		required: true,
		view: {
			label: 'Item / Action',
			type: 'select',
			choices: itemChoices,
		}
	}

	const optionalTime = {
		type: "number",
		value: undefined,
		required: false,
		view: {
			label: 'time',
			placeholder: 'now',
			description: 'no indication means "now"'
		}
	}

	function locationParam(label: string = 'Location') {
		return {
			type: 'object',
			required: true,
			view: {
				label: label,
			},
			properties: {
				mapId: {
					type: 'string',
					value: 'the_world',
					view: {
						type: 'hidden',
					}
				},
				x: { type: 'number', required: true, view: { label: 'x' } },
				y: { type: 'number', required: true, view: { label: 'y' } }
			}
		}
	}
	

	ServerMethods.registerGlobalMethod(['TimeManager'], 'start', {
		label: 'Start Simulation',
		parameters: [],
		returns: undefined,
	});

	ServerMethods.registerGlobalMethod(['TimeManager'], 'pause', {
		label: 'Pause Simulation',
		parameters: [],
		returns: undefined,
	});

	/**
	 * afflictPathology: function (humanId, pathologyId, blocks, time); 
	 */
	/*ServerMethods.registerGlobalMethod(['EventManager'], 'afflictPathology', {
		label: 'Afflict',
		parameters: [humanSelector, pathologiesChoices, blocksSelector, optionalTime],
		returns: undefined,
	});*/

	/**
	 * doItemAction: function (humanId, {itemId, actionId}, blocks, time)
	 */
	/*ServerMethods.registerGlobalMethod(['EventManager'], 'doItemAction', {
		label: 'Use item on Human',
		parameters: [humanSelector, itemSelector, blocksSelector, optionalTime],
		returns: undefined,
	});*/

	/**
	 * object : {objectType: string, objectId: string}
	 * location: {mapId: string, x: number, y: number}
	 * teleport: function (object, location, time)
	 */
	/*ServerMethods.registerGlobalMethod(['EventManager'], 'teleport', {
		label: 'Teleport',
		parameters: [moveableObjectSelector, locationParam(), optionalTime],
		returns: undefined,
	});*/

	/**
	 * object : {objectType: string, objectId: string}
	 * destination: {mapId: string, x: number, y: number}
	 * moveTo: function (object, location, time) {
	 */
	/*ServerMethods.registerGlobalMethod(['EventManager'], 'followPath', {
		label: 'Move From/To (walk / drive)',
		parameters: [moveableObjectSelector, locationParam('from'), locationParam('to'), optionalTime],
		returns: undefined,
	});

	ServerMethods.registerGlobalMethod(['EventManager'], 'directCommunication', {
		label: 'Speak in the wild',
		parameters: [],
		returns: undefined,
    });*/
});

// delay customization to make sure every others modules are available
//setTimeout(addCustomImpacts, 100);
