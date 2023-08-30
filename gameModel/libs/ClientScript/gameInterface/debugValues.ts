// TODO Remove this file (radio still in use)

interface Action {
	id: number,
	startTime: number,
	duration: number,
	title: string,
	description: string
}

export const waitingForTranslation = 'minutes';

export const dummyActionsChoices: Action[] = [
{
		id: 0,
		startTime: 0,
		duration: 42,
		title: 'First Action',
		description: 'Such a nice description'
	},

	{
		id: 1,
		startTime: 0,
		duration: 22,
		title: 'Second Action',
		description: 'Such a nice description'
	},

	{
		id: 2,
		startTime: 0,
		duration: 60,
		title: 'Third Action',
		description: 'Such a nice description'
	},

	{
		id: 3,
		startTime: 0,
		duration: 60,
		title: 'Fourth Action',
		description: 'Such a nice description'
	},

	{
		id: 4,
		startTime: 0,
		duration: 60,
		title: 'Fourth Action',
		description: 'Such a nice description'
	},

	{
		id: 5,
		startTime: 0,
		duration: 60,
		title: '5 Action',
		description: 'Such a nice description'
	},

	{
		id: 6,
		startTime: 0,
		duration: 60,
		title: '6 Action',
		description: 'Such a nice description'
	},

	{
		id: 7,
		startTime: 0,
		duration: 60,
		title: '7 Action',
		description: 'Such a nice description'
	},
		{
		id: 8,
		startTime: 0,
		duration: 60,
		title: '8 Action',
		description: 'Such a nice description'
	},
		{
		id: 9,
		startTime: 0,
		duration: 60,
		title: '9 Action',
		description: 'Such a nice description'
	},
		{
		id: 10,
		startTime: 0,
		duration: 60,
		title: '10 Action',
		description: 'Such a nice description'
	},
		{
		id: 11,
		startTime: 0,
		duration: 60,
		title: '11 Action',
		description: 'Such a nice description'
	},
]

export function getDummyActionChoices() {
	return dummyActionsChoices;
}

interface Radio {
	id: number,
	msgFrom: string,
	content: string
}

export const dummyRadio: Radio[] = [
{
	id: 0,
	msgFrom: 'ACS',
	content: 'Allô, allô, y a dl eau dans les tuyeaux'
	},
	{
	id: 2,
	msgFrom: 'MCS',
	content: 'On a de la chance avec le temps'
	},

	{
	id: 3,
	msgFrom: 'AL',
	content: 'Beau pays mais sec'
	},

		{
	id: 4,
	msgFrom: 'MCS',
	content: 'c est pas le pingouin qui glisse le plus loin sur la banquise'
	},

		{
	id: 5,
	msgFrom: 'ACS',
	content: 'c est pas le glaçon le plus rafraichissant du cocktail'
	},

	{
	id: 6,
	msgFrom: 'MCS',
	content: 'c est  pas la chips la plus croustillante du paquet'
	},

{
	id: 7,
	msgFrom: 'ACS',
	content: 'c est pas le son le plus écouté de la mixtape '
	},

{
	id: 8,
	msgFrom: 'AL',
	content: 'c est pas le jardin le plus fleuri du quartier'
	},


	
]

export function getDummyRadio() {
	return dummyRadio;
}

interface Tasks {
	id: number,
	startTime: number,
	duration: number,
	title: string,
	description: string
}


export const dummyTasks: Tasks[] = [
{
		id: 0,
		startTime: 0,
		duration: 42,
		title: 'First Action',
		description: 'Such a nice description'
	},
	{
		id: 1,
		startTime: 0,
		duration: 42,
		title: 'TRI zone 1',
		description: 'Such a nice description. But a medium long one.'
	},
	{
		id: 2,
		startTime: 0,
		duration: 42,
		title: 'First Action',
		description: 'Such a nice description, and this time one of those that takes ages to be red.'
	},
	{
		id: 3,
		startTime: 0,
		duration: 42,
		title: 'First Action',
		description: 'Such a nice description bis'
	}
];

// interface Tasks {
// 	Uid: number,
// 	startTime: number,
// 	duration: number,
// 	title: string,
// 	description: string,
// 	status: 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled',
// 	nbCurrentResources: number,
// }


// export const dummyTasks: Tasks[] = [
// {
// 		Uid: 0,
// 		startTime: 0,
// 		duration: 42,
// 		title: 'First Action',
// 		description: 'Such a nice description',
// 		status: 'Uninitialized',
// 		nbCurrentResources: 0,
// 	},
// 	{
// 		Uid: 1,
// 		startTime: 0,
// 		duration: 42,
// 		title: 'TRI zone 1',
// 		description: 'Such a nice description. But a medium long one.',
// 		status: 'OnGoing',
// 		nbCurrentResources: 3,
// 	},
// 	{
// 		Uid: 2,
// 		startTime: 0,
// 		duration: 42,
// 		title: 'First Action',
// 		description: 'Such a nice description, and this time one of those that takes ages to be red.',
// 		status: 'Paused',
// 		nbCurrentResources: 1,
// 	},
// 	{
// 		Uid: 3,
// 		startTime: 0,
// 		duration: 42,
// 		title: 'First Action',
// 		description: 'Such a nice description bis',
// 		status: 'Completed',
// 		nbCurrentResources: 0,
// 	}
// ];

export function getTasks() {
	return dummyTasks;
}