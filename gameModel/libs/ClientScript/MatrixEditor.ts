export interface MatrixState {
	xFilter: string;
	yFilter: string;
}

export function getInitialMatrixState() : MatrixState {
	return {
		xFilter: '',
		yFilter: '',
	}
}

export function getMatrixState() : MatrixState {
	return Context.matrixState.state;
}

export function setMatrixState(setter: (state : MatrixState) => MatrixState) {
	Context.matrixState.setState(setter);
}

export interface DataDef<T> {
	/**
	 * Row/cell label
	 */
	label: string;
	/**
	 * row/cell identifier
	 */
	id: T;
}

/**
 * Display as checkboxes
 */
export interface BooleanDef {
	type: 'boolean';
	label: string;
}

/**
 * Display as selects
 */
export interface EnumDef {
	type: 'enum';
	label: string;
	values: (undefined | number | boolean | string)[];
}

/**
 * Input
 */
export interface NumberDef {
	type: 'number';
	label: string;
	min?: number;
	max?: number;
}

export type CellDef = EnumDef | BooleanDef | NumberDef;

export type MatrixKey = string | number;

export type CellData = number | boolean | undefined | string;

export type EhancedCellData<T extends CellData> = T | {
	label: string;
	value: T;
}

export interface MatrixConfig<X extends MatrixKey, Y extends MatrixKey, Data extends CellData> {
	x: DataDef<X>[];
	y: DataDef<Y>[];
	data: Record<X, Record<Y, EhancedCellData<Data>>>;
	cellDef: CellDef[];
	/**
	 * HACK: onChange Callback register as ref (Helpers.useRef(THE_NAME, () => ))
	 */
	onChangeRefName: string;
}


function filterSerie(serie: DataDef<MatrixKey>[], motif: string) : DataDef<MatrixKey>[] {
	if (!motif){
		return serie
	} else {
		const regexes = motif.split(/\s+/).map(m => new RegExp(Helpers.escapeRegExp(m), "i"));
		return serie.filter(item => {
			// item must match all regexes
			// if any does not match, the item does not match
			return regexes.find(regex => {
				// try to tind one regex which does not match
				return !regex.exec(item.label)
			}) == null;
		})
	}
	
}

export function getFilteredXSerie() : DataDef<MatrixKey>[]{
	return filterSerie(Context.matrixConfig.x, getMatrixState().xFilter);
}


export function getFilteredYSerie() : DataDef<MatrixKey>[] {
	return filterSerie(Context.matrixConfig.y, getMatrixState().yFilter);
}


const noDefs: EnumDef = {
	type: 'enum',
	label: 'no defs',
	values: [undefined],
};

function getCellData() {
	const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;

	const x = Context.column.id;
	const y = Context.line.id;
	const col = config.data[x];
	const data = col == null ? undefined : col[y];
	if (typeof data === 'object'){
		return data.value;
	} else {
		return data;
	}
}

export function getCellLabel() : string | undefined{
	const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;

	const x = Context.column.id;
	const y = Context.line.id;
	const col = config.data[x];
	const data = col == null ? undefined : col[y];
	if (typeof data === 'object'){
		return data.label;
	} else {
		return undefined;
	}
}


export function getCellCurrentConfigIndex(): number {
	const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;

	if (config.cellDef.length === 0) {
		return -1;
	} else if (config.cellDef.length === 1) {
		return 0;
	} else {
		// guess which one is in use
		const data = getCellData();
		for (const index in config.cellDef) {
			const def = config.cellDef[index];
			if (def != null) {
				switch (def.type) {
					case 'boolean':
						if (typeof data === 'boolean') {
							return +index;
						}
						break;
					case 'enum':
						if (def.values.includes(data)) {
							return +index;
						}
						break;
					case 'number':
						if (typeof data === 'number') {
							return +index;
						}
						break;
				}
			}
		}

		return -1;
	}
}

export function getCellCurrentConfig(): CellDef {
	const index = getCellCurrentConfigIndex();
	if (index >= 0) {
		const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;
		return config.cellDef[index] || noDefs;
	} else {
		return noDefs;
	}
}

export function getIterableCellDefs(): { id: number; def: CellDef }[] {
	const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
	return config.cellDef.map((def, i) => ({ id: i, def: def }));
}

export function getCellStringValue(): string {
	return String(getCellData());
}

export function getCellBooleanValue(): boolean {
	return !!getCellData();
}

export function getCellNumericValue(): number {
	const value = getCellData();
	if (typeof value === 'number') {
		return value;
	} else {
		return 0;
	}
}

export function getCellCurrentConfigChoices(): {
	label: string;
	value: string;
}[] {
	const cellDef = getCellCurrentConfig();
	if (cellDef.type === 'enum') {
		return cellDef.values.map(v => ({ label: String(v), value: String(v) }));
	} else {
		return [];
	}
}

function getValueFromDef(def: CellDef) {
	switch (def.type) {
		case 'boolean':
			return true;
		case 'enum':
			return def.values[0];
		case 'number':
			return def.min ?? 0;
	}
}

export function switchToDef(def: CellDef) {
	updateValue(getValueFromDef(def));
}

export function updateNumericValue(value: number | string) {
	wlog('Num Value ', value);
	if (typeof value === 'number') {
		wlog('Num Value is a number');
		updateValue(value);
	} else {
		const n = +value;
		wlog('PArse ', n);
		if (!Number.isNaN(n)) {
			updateValue(n);
		}
	}
}

export function updateValueFromSelect(value: string) {
	const def = getCellCurrentConfig();
	if (def.type === 'enum') {
		const index = def.values.findIndex(v => String(v) === value);
		if (index >= 0) {
			updateValue(def.values[index]);
		}
	}
}

export function updateValue(value: unknown) {
	const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;

	const onChange = Helpers.useRef(
		config.onChangeRefName,
		(x: DataDef<MatrixKey>, y: DataDef<MatrixKey>, value: unknown) => {},
	);
	onChange.current(Context.column, Context.line, value);
}

/**********************************************
 * DEBUG
 */

const testMatrix: Record<number, Record<number, CellData>> = {
	0: {
		0: 0,
		1: true,
		2: false,
	},
	1: {
		0: 0,
		1: true,
		2: false,
	},
	2: {
		0: 0,
		1: true,
		2: false,
	},
	3: {
		0: 0,
		1: true,
		2: false,
	},
};

const onChangeRef = Helpers.useRef(
	'testMatrixOnChange',
	(x: DataDef<number>, y: DataDef<number>, value: CellData) => {},
);

onChangeRef.current = (x: DataDef<number>, y: DataDef<number>, newData: CellData) => {
	testMatrix[x.id]![y.id] = newData;
	// Hack: touch boolean to force UIsync
	APIMethods.runScript(
		"var v = Variable.find(gameModel, 'trigger').getInstance(self); v.setValue(!v.getValue())",
		{},
	);
};

export const testMatrixConfig: MatrixConfig<number, number, CellData> = {
	x: [
		{ label: 'x 1st', id: 0 },
		{ label: 'x 2nd', id: 1 },
		{ label: 'x 3rd', id: 2 },
		{ label: 'x 4th', id: 3 },
	],
	y: [
		{ label: 'y 1er', id: 0 },
		{ label: 'y 2e', id: 1 },
		{ label: 'y 3e', id: 2 },
	],
	data: testMatrix,
	cellDef: [
		{
			type: 'number',
			label: 'limited',
		},
		{
			type: 'boolean',
			label: 'bool',
		},
	],
	onChangeRefName: 'testMatrixOnChange',
};
