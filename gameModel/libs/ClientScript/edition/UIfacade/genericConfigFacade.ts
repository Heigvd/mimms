import { Uid } from '../../game/common/interfaces';
import {
  ConfigItem,
  ConfigItemSupertype,
  ConfigKind,
  createNew,
  getFlatData,
  saveDataToVariable,
} from '../genericConfigController';

export interface GenericConfigState {
  data: Record<Uid, ConfigItem>;
  selected: Partial<Record<ConfigItemSupertype, Uid | undefined>>;
}

export function loadInitialState(kind: ConfigKind): GenericConfigState {
  return {
    data: getFlatData(kind),
    selected: {},
  };
}

export function saveToVariable(kind: ConfigKind): void {
  saveDataToVariable(kind, getData());
}

export function getState(): GenericConfigState {
  return Context.configState.state;
}

//////////////////////////////////////////////////////////////////////////////////////
// selection

// Note : use undefined to unselect
export function select(superType: ConfigItemSupertype, uid: Uid | undefined): void {
  const newState = Helpers.cloneDeep(getState());
  newState.selected[superType] = uid;
  Context.configState.setState(newState);
}

export function unselect(superType: ConfigItemSupertype): void {
  select(superType, undefined);
}

export function getSelected(superType: ConfigItemSupertype): ConfigItem | undefined {
  const selectedUid = getState().selected[superType];
  if (selectedUid) {
    return getData()[selectedUid];
  }
  return undefined;
}

export function isSelected(superType: ConfigItemSupertype, uid: Uid): boolean {
  return getSelected(superType)?.uid === uid;
}

export function isSomethingSelected(superType: ConfigItemSupertype): boolean {
  return getSelected(superType) != undefined;
}

//////////////////////////////////////////////////////////////////////////////////////
// items

function getData(): Record<Uid, ConfigItem> {
  return getState().data;
}

function getDataAsArray(): ConfigItem[] {
  return Object.values(getState().data);
}

export function getItems(
  superType: ConfigItemSupertype,
  parentSuperType?: ConfigItemSupertype
): ConfigItem[] {
  let result: ConfigItem[] = [];

  if (parentSuperType == undefined) {
    result = getDataAsArray().filter(item => item.superType === superType);
  } else {
    const selectedParent = getSelected(parentSuperType)?.uid;
    if (selectedParent !== undefined) {
      result = getDataAsArray().filter(
        item => item.superType === superType && item.parent === selectedParent
      );
    }
  }

  return result.sort((a: ConfigItem, b: ConfigItem) => a.index - b.index);
}

export function addNew(
  superType: ConfigItemSupertype,
  parentSuperType?: ConfigItemSupertype
): void {
  let parentUid: Uid | undefined = undefined;
  if (parentSuperType) {
    parentUid = getSelected(parentSuperType)?.uid;
  }

  const newState: GenericConfigState = Helpers.cloneDeep(Context.configState.state);
  const newItem = {
    ...createNew(superType, parentUid),
    // TODO index
  };
  newState.data[newItem.uid] = newItem;
  newState.selected[superType] = newItem.uid;
  Context.configState.setState(newState);
}

export function updateItem(_superType: ConfigItemSupertype, uid: Uid, newData: any): void {
  const newState: GenericConfigState = Helpers.cloneDeep(Context.configState.state);
  const updatedItem = {
    ...newState.data[uid],
    ...newData,
  };
  newState.data[uid] = updatedItem;
  Context.configState.setState(newState);
}

export function deleteItem(superType: ConfigItemSupertype, uid: Uid): void {
  const newState: GenericConfigState = Helpers.cloneDeep(Context.configState.state);
  newState.selected[superType] = undefined;
  delete newState.data[uid];
  // TODO recompute indexes
  Context.configState.setState(newState);
}

//////////////////////////////////////////////////////////////////////////////////////
// detail page

export function getDetailPage(superType: ConfigItemSupertype): string {
  switch (superType) {
    case 'trigger':
      return '32';
    case 'condition':
      return '33';
    case 'impact':
      return '34';
  }

  return '';
}

//////////////////////////////////////////////////////////////////////////////////////
// in list change

export function isAlone(_superType: ConfigItemSupertype, _uid: Uid): boolean {
  return true; // for the moment, not handled
}

export function canMoveUp(_superType: ConfigItemSupertype, _uid: Uid): boolean {
  return true;
}

export function canMoveDown(_superType: ConfigItemSupertype, _uid: Uid): boolean {
  return true;
}

export function moveUp(_superType: ConfigItemSupertype, _uid: Uid): void {}

export function moveDown(_superType: ConfigItemSupertype, _uid: Uid): void {}

//////////////////////////////////////////////////////////////////////////////////////
// validation

export function validateItem(_superType: ConfigItemSupertype, _uid: Uid) {}
