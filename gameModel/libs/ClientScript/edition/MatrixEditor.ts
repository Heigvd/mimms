// ts-unused-exports:disable-next-line
export interface MatrixState {
  xFilter: string;
  yFilter: string;
  toggle: boolean;
}

export function getInitialMatrixState(): MatrixState {
  return {
    xFilter: '',
    yFilter: '',
    toggle: true,
  };
}

export function getMatrixState(): MatrixState {
  return Context.matrixState.state;
}

export function setMatrixState(setter: (state: MatrixState) => MatrixState) {
  Context.matrixState.setState(setter);
}

export interface DataDef<T extends MatrixKey> {
  /**
   * Row/cell label
   */
  label: string;
  /**
   * row/cell identifier
   */
  id: T;
}

interface DataDefChange {
  enableCreation: boolean;

  createdEntryDefaultLabel?: string;

  addEntryButtonLabel?: string;
  /**
   * HACK: onChange Callback register as ref (Helpers.useRef(THE_NAME, () => ))
   */
  callbackRefName: string;
}

/**
 * Display as checkboxes
 */
// ts-unused-exports:disable-next-line
export interface BooleanDef {
  type: 'boolean';
  tooltip?: string;
  label: string;
}

type EnumValue = undefined | number | boolean | string;

/**
 * Display as selects
 */
// ts-unused-exports:disable-next-line
export interface EnumDef {
  type: 'enum';
  tooltip?: string;
  label: string;
  values: (EnumValue | { label: string; value: EnumValue })[];
}

/**
 * Input
 */
// ts-unused-exports:disable-next-line
export interface NumberDef {
  type: 'number';
  tooltip?: string;
  label: string;
  min?: number;
  max?: number;
}

export type CellDef = EnumDef | BooleanDef | NumberDef;

// ts-unused-exports:disable-next-line
export type MatrixKey = string | number;

// ts-unused-exports:disable-next-line
export type CellData = number | boolean | undefined | string;

export type EnhancedCellData<T extends CellData> =
  | T
  | {
      label: string;
      value: T;
    };

export interface MatrixConfig<X extends MatrixKey, Y extends MatrixKey, Data extends CellData> {
  x: DataDef<X>[];
  y: DataDef<Y>[];
  data: Record<X, Record<Y, EnhancedCellData<Data>>>;
  cellDef: CellDef[];
  /**
   * HACK: onChange Callback register as ref (Helpers.useRef(THE_NAME, () => ))
   */
  onChangeRefName: string;
  hideFilter?: boolean;

  dataDefChangeColumn?: DataDefChange;
  dataDefChangeRow?: DataDefChange;

  dataDefRemoveColumn?: string;
  dataDefRemoveRow?: string;
}

function filterSerie(serie: DataDef<MatrixKey>[], motif: string): DataDef<MatrixKey>[] {
  if (!motif) {
    return serie;
  } else {
    const regexes = motif.split(/\s+/).map(m => new RegExp(Helpers.escapeRegExp(m), 'i'));
    return serie.filter(item => {
      // item must match all regexes
      // if any does not match, the item does not match
      return (
        regexes.find(regex => {
          // try to tind one regex which does not match
          return !regex.exec(item.label || '');
        }) == null
      );
    });
  }
}

export function getFilteredXSerie(): DataDef<MatrixKey>[] {
  return filterSerie(Context.matrixConfig.x, getMatrixState().xFilter);
}

export function getFilteredYSerie(): DataDef<MatrixKey>[] {
  return filterSerie(Context.matrixConfig.y, getMatrixState().yFilter);
}

const noDefs: EnumDef = {
  type: 'enum',
  label: 'no defs',
  values: [undefined],
};

export function getCellValue() {
  const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;

  const x = Context.column.id;
  const y = Context.line.id;
  const col = config.data[x];
  const data = col == null ? undefined : col[y];
  if (typeof data === 'object') {
    return data.value;
  } else {
    return data;
  }
}

export function getCellLabel(): string | undefined {
  const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;

  const x = Context.column.id;
  const y = Context.line.id;
  const col = config.data[x];
  const data = col == null ? undefined : col[y];
  if (typeof data === 'object') {
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
    const data = getCellValue();
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
            for (const item of def.values) {
              const v = typeof item === 'object' ? item.value : item;
              if (v === data) {
                return +index;
              }
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

export function getCellConfigByIndex(index: number): CellDef {
  if (index >= 0) {
    const config: MatrixConfig<MatrixKey, MatrixKey, CellData> = Context.matrixConfig;
    return config.cellDef[index] || noDefs;
  } else {
    return noDefs;
  }
}

export function getCellCurrentConfig(): CellDef {
  const index = getCellCurrentConfigIndex();
  return getCellConfigByIndex(index);
}

export function getIterableCellDefs(): { id: number; def: CellDef }[] {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return config.cellDef.map((def, i) => ({ id: i, def: def }));
}

export function getCellStringValue(): string {
  return String(getCellValue());
}

export function getCellBooleanValue(): boolean {
  return !!getCellValue();
}

export function getCellNumericValue(): number {
  const value = getCellValue();
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
    return cellDef.values.map(v => {
      if (typeof v === 'object') {
        return { label: v.label, value: String(v.value) };
      } else {
        return { label: String(v), value: String(v) };
      }
    });
  } else {
    return [];
  }
}

function getValueFromDef(def: CellDef) {
  switch (def.type) {
    case 'boolean':
      return true;
    case 'enum': {
      const item = def.values[0];
      if (typeof item === 'object') {
        return item.value;
      } else {
        return item;
      }
    }
    case 'number':
      return def.min ?? 0;
  }
}

export function switchToDef(def: CellDef) {
  updateValue(getValueFromDef(def));
}

export function updateNumericValue(value: number | string) {
  if (typeof value === 'number') {
    updateValue(value);
  } else {
    const n = +value;
    if (!Number.isNaN(n)) {
      updateValue(n);
    }
  }
}

export function updateValueFromSelect(value: string) {
  const def = getCellCurrentConfig();
  if (def.type === 'enum') {
    const index = def.values.findIndex(v => {
      if (typeof v === 'object') {
        return String(v.value) === value;
      } else {
        return String(v) === value;
      }
    });
    if (index >= 0) {
      const v = def.values[index];
      updateValue(typeof v === 'object' ? v.value : v);
    }
  }
}

export function updateValue(value: unknown) {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;

  const onChange = Helpers.useRef(
    config.onChangeRefName,
    (x: DataDef<MatrixKey>, y: DataDef<MatrixKey>, value: unknown) => {},
  );
  wlog('OnChange: ', Context.column, Context.line, value);
  onChange.current(Context.column, Context.line, value);
}

export function updateXColumn(id?: MatrixKey, label?: string) {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;

  if (config.dataDefChangeColumn) {
    const onChange = Helpers.useRef(
      config.dataDefChangeColumn.callbackRefName,
      (x: DataDef<MatrixKey> | undefined) => {},
    );
    //wlog('OnChange: ', Context.column, Context.line, value);
    const l = label || config.dataDefChangeColumn.createdEntryDefaultLabel || 'new';

    onChange.current({ label: l, id: id || makeUid() });
    setMatrixState(s => ({ ...s, toggle: !s.toggle }));
  }
}

function makeUid(): MatrixKey {
  return Math.floor(Math.random() * 10000000000);
}

export function updateYRow(id?: MatrixKey, label?: string) {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;

  if (config.dataDefChangeRow) {
    const onChange = Helpers.useRef(
      config.dataDefChangeRow.callbackRefName,
      (y: DataDef<MatrixKey>) => {},
    );
    const l = label || config.dataDefChangeRow.createdEntryDefaultLabel || 'new';
    onChange.current({ label: l, id: id || makeUid() });
    setMatrixState(s => ({ ...s, toggle: !s.toggle }));
  }
}

export function removeColumn(id: MatrixKey) {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  if (config.dataDefRemoveColumn) {
    const removeX = Helpers.useRef(config.dataDefRemoveColumn, (id: MatrixKey) => {});
    removeX.current(id);
    setMatrixState(s => ({ ...s, toggle: !s.toggle }));
  }
}

export function removeRow(id: MatrixKey) {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  if (config.dataDefRemoveRow) {
    const removeY = Helpers.useRef(config.dataDefRemoveRow, (id: MatrixKey) => {});
    removeY.current(id);
    setMatrixState(s => ({ ...s, toggle: !s.toggle }));
  }
}

export function getAddColumnButtonLabel(): string {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return config.dataDefChangeColumn?.addEntryButtonLabel || 'Add Column';
}

export function getAddRowButtonLabel(): string {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return config.dataDefChangeRow?.addEntryButtonLabel || 'Add Row';
}

export function canAddRow(): boolean {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return !!config.dataDefChangeRow?.enableCreation;
}

export function canAddColumn(): boolean {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return !!config.dataDefChangeColumn?.enableCreation;
}

export function canEditRow(): boolean {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return config.dataDefChangeRow != null;
}

export function canEditColumn(): boolean {
  const config: MatrixConfig<MatrixKey, MatrixKey, boolean> = Context.matrixConfig;
  return config.dataDefChangeColumn != null;
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
    0: true,
    1: true,
    2: false,
    3: true,
  },
};

const onChangeRef = Helpers.useRef(
  'testMatrixOnChange',
  (x: DataDef<number>, y: DataDef<number>, value: CellData) => {},
);

onChangeRef.current = (x: DataDef<number>, y: DataDef<number>, newData: CellData) => {
  testMatrix[x.id!]![y.id!] = newData;
  setMatrixState(s => ({ ...s, toggle: !s.toggle }));

  // Hack: touch boolean to force UIsync
  /*APIMethods.runScript(
        "var v = Variable.find(gameModel, 'trigger').getInstance(self); v.setValue(!v.getValue())",
        {},
    );*/
};

const onRowChangeRef = Helpers.useRef('testMatrixOnRowChangeRef', (y: DataDef<number>) => {});

let lastId = 100;

const defaultLabel = 'New entry';

onRowChangeRef.current = (y: DataDef<number>) => {
  // search existing
  const elem = testMatrixData.x.find(e => e.id === y.id);
  if (elem) {
    // update it
    elem.label = y.label || defaultLabel;
  } else {
    y.id = lastId++;
    y.label = y.label || defaultLabel;
    testMatrixData.y.push(y);
  }
};

const onColumnChangeRef = Helpers.useRef('testMatrixOnColumnChangeRef', (y: DataDef<number>) => {});

onColumnChangeRef.current = (x: DataDef<number>) => {
  // search existing
  const elem = testMatrixData.x.find(e => e.id === x.id);
  if (elem) {
    // update it
    elem.label = x.label || '';
  } else {
    x.id = lastId++;
    x.label = x.label || defaultLabel;
    testMatrixData.x.push(x);
  }
};

const onColumnDeleteRef = Helpers.useRef('testRemoveX', (id: number) => {});

onColumnDeleteRef.current = (xid: number) => {
  const i = testMatrixData.x.findIndex(e => e.id == xid);
  if (i > -1) {
    testMatrixData.x.splice(i, 1);
    wlog('deleted ', i, xid);
  }
};

const onRowDeleteRef = Helpers.useRef('testRemoveY', (id: number) => {});

onRowDeleteRef.current = (xid: number) => {
  const i = testMatrixData.y.findIndex(e => e.id == xid);
  if (i > -1) {
    testMatrixData.y.splice(i, 1);
    wlog('deleted ', i, xid);
  }
};

const testMatrixData = {
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
};

export function testMatrixConfig(): MatrixConfig<number, number, CellData> {
  return {
    ...testMatrixData,
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
      {
        type: 'enum',
        label: 'enum',
        values: ['raw', { label: 'lets cook', value: 'cooked' }],
      },
    ],
    onChangeRefName: 'testMatrixOnChange',
    dataDefChangeColumn: {
      enableCreation: true,
      createdEntryDefaultLabel: 'New column',
      callbackRefName: 'testMatrixOnColumnChangeRef',
    },
    dataDefChangeRow: {
      enableCreation: false,
      callbackRefName: 'testMatrixOnRowChangeRef',
    },
    dataDefRemoveColumn: 'testRemoveX',
    dataDefRemoveRow: 'testRemoveY',
  };
}
