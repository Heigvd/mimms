import { Uid } from '../../game/common/interfaces';
import { ConfigData, ConfigDataBaseKind, ConfigDataKind, getInitialState } from '../g1';

//export type ConfigStateType = Partial<Record<ConfigDataKind, Record<Uid, ConfigData>>>;
export type ConfigStateType = ConfigData[];

export interface GenericConfigState {
  data: ConfigStateType;
  selected: Partial<Record<ConfigDataKind, Uid | undefined>>;
}

export function getState(): GenericConfigState {
  return Context.genericConfigState.state;
}

export function loadInitialState(kind: ConfigDataBaseKind): GenericConfigState {
  return {
    data: getInitialState(kind),
    selected: {},
  };
}

// use undefined to unselect
export function select(kind: ConfigDataKind, uid: Uid | undefined) {
  const newState = Helpers.cloneDeep(getState());
  newState.selected[kind] = uid;
  Context.genericConfigState.setState(newState);
}

export function getConfigData(
  kind: ConfigDataKind,
  parentKind?: ConfigDataKind | undefined
): ConfigData[] {
  let result: ConfigData[] = [];

  if (parentKind == undefined) {
    result = getState().data.filter(entry => entry.superType === kind);
  } else {
    const selectedParent = getState().selected[parentKind];
    if (selectedParent !== undefined) {
      result = getState().data.filter(
        entry => entry.superType === kind && entry.parent === selectedParent
      );
    }
  }

  return result.sort((a: ConfigData, b: ConfigData) => a.index - b.index);
}
