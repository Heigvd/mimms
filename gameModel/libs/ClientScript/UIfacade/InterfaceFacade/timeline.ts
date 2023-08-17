import { getAllActions } from "../../UIfacade/actionFacade";
import { getAllActors, getCurrentActorRole } from "../../UIfacade/actorFacade";

interface Action {
	startTime: number,
	duration: number,
	title: string,
}

interface Timeline {
	id: string;
	timeline: Action[];
}

/**
 * Build an array of Timelines for the current set of actions/actors
 * @return {Timeline[]}
 */
export function buildTimelineObject(): Timeline[] {
	const timelines: any = [];

	const actors = getAllActors();
	const actions = getAllActions();

	for (const actor of actors) {
		const timeline: Action[] = [];
		if (actions[actor.Uid] !== undefined) {
			for (const action of actions[actor.Uid]) {
				timeline.push({
					startTime: action.startTime,
					duration: action.duration(),
					// TODO Somehow retrieve action titles!
					title: 'Action Title'
				})
			}
		}	
		timelines.push({
			id: actor.Role,
			timeline: timeline,
		})
	}

	return timelines;
}

/**
 * 
 * @param {number} maxTime The timelines max displayed time
 * @param {number} currentTime Current time in the game
 * @return {string} HTML timeline markers
 */
function createGridTimes(maxTime: number, currentTime: number): string {
	let columnIndex = 1;
	let steps = maxTime / 60;
	let timer = 0;
	let output = '';

	for (let i = 0; i < steps; i++) {
		output += createGridSegment( 1, 2, columnIndex, columnIndex+1, '' ,'marker-time', `<div class="${timer === currentTime ? 'time current' : 'time'}">${String(timer)}</div>`);
		output += createGridSegment( 1, -1, columnIndex, columnIndex+1, '' ,'marker', `<div class="${timer === currentTime ? 'marker-line current' : 'marker-line'}"></div>`);
		timer += 60;
		columnIndex += 2;
	}

	return output;
}

/**
 * 
 * @param {number} rowStart Segment CSS grid-row-start
 * @param {number} rowEnd Segment CSS grid-row-end
 * @param {number} columnStart Segment CSS grid-column-start
 * @param {number} columnEnd Segment CSS grid-column-end
 * @param {string} [title] Segment title to be displayed
 * @param {string} [className] Segment class
 * @param {string} [children] Segment children to be displayed
 * @return {string} HTML segment
 */
function createGridSegment(
	rowStart: number,
	rowEnd: number,
	columnStart: number,
	columnEnd: number,
	title?: string,
	className?: string,
	children?: string,
): string {
	return (`
		<div style="
			grid-row-start:${rowStart};
			grid-row-end:${rowEnd};
			grid-column-start:${columnStart};
			grid-column-end:${columnEnd};
		"
		${className ? `class="${className}"` : ''}
		>
		${title ? title : ''}
		${children ? children : ''}
		</div>`)
}

/** Creates a timeline row on the grid
 * 
 * @param {number} row The row on which the timeline is
 * @param {boolean} active Is the grid row the actively selected one ?
 * @param {Action[]} actions Actions of a specific actor
 * @return {string} HTML timeline
 */
function createGridRow(row: number, current: boolean, actions: Action[]): string {

	// Starts at 2 and increments by 2 to skip markers positions
	let gridIndex = 2;
	let actionIndex = 0;
	let timer = 0;

	let output = '';

	while (actionIndex < actions.length) {
		// If the action takes place later than current timer, we move forward
		if (timer === actions[actionIndex].startTime) {
			let actionDuration = actions[actionIndex].duration;
			let actionStartIndex = gridIndex;
			// Marker positions need to be taken into account
			let actionEndIndex = gridIndex + ((actionDuration / 60) * 2 - 1)

			output += createGridSegment(row, row+1, actionStartIndex, actionEndIndex, actions[actionIndex].title, current ? 'timeline-item current' : 'timeline-item')

			timer += actionDuration;
			actionIndex++;
		} else if (timer > actions[actionIndex].startTime) {
			actionIndex++;
		} else {
			timer += 60;
		}
		gridIndex += 2;
	}

	return output;
}


/**
 * Creates a timeline html grid returned as string
 * 
 * @param {number} currentTime The current in game time
 * @param {Timeline[]} timelines Array of timelines to be displayed
 * @return {string} HTML grid
 */
export function createGrid(currentTime: number, timelines: Timeline[]): string {


	// Calculate the total amount of actions represented on the timeline
	// We add empty segments to represent future actions
	const futureSegments = 4;
	// Future time displayed
	const maxTime = currentTime + (futureSegments * 60);
	const totalColumns = (maxTime / 60);
	const totalRows = timelines.length + 1;

	let timelinesHTML = '';
	for (let i = 0; i < timelines.length; i++) {
	// TODO Implement getCurrentRole();
		const active = timelines[i].id === getCurrentActorRole();
		timelinesHTML += createGridRow(i+2,  active, timelines[i].timeline);
	}

	let markersHTML = createGridTimes(maxTime+60, currentTime);

	return `
			<div class="timeline-grid" style="display:grid;grid-template-columns: repeat(${totalColumns}, 1em 10em) 1em;grid-template-rows:repeat(${totalRows}, 2em)">
			${timelinesHTML}
			${markersHTML}
			</div>`
}