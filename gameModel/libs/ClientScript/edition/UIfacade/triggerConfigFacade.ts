import { Uid } from '../../game/common/interfaces';
import { patchX } from '../../tools/helper';
import { getTriggerController } from '../controllers/controllerInstances';
import { TriggerFlatType } from '../controllers/dataController';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { GenericScenaristInterfaceState, getItems } from './genericConfigFacade';

//////////////////////////////////////////////////////////////////////////////////////
// UI state

export type TriggerConfigUIState = GenericScenaristInterfaceState;

export function getInitialTriggerUIState(): TriggerConfigUIState {
  return {
    selected: {},
  };
}

//////////////////////////////////////////////////////////////////////////////////////
// get data

export function getTriggers(mandatory: boolean): FlatTrigger[] {
  return getItems('trigger')
    .filter(item => item.superType === 'trigger')
    .map(trigger => trigger as FlatTrigger)
    .filter(trigger => trigger.mandatory == mandatory);
}

//////////////////////////////////////////////////////////////////////////////////////
// update data

export function updateItem<T extends TriggerFlatType>(uid: Uid, newData: Partial<T>): void {
  const controller = getTriggerController();
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone();
  if (data[uid] != undefined) {
    data[uid] = patchX(data[uid], newData)!;
    controller.updateData(data);
  }
}

//////////////////////////////////////////////////////////////////////////////////////

export function getTriggerTag(triggerUid: Uid): string | undefined {
  const item = getItems('trigger')
    .map(item => item as FlatTrigger)
    .find(item => item.uid === triggerUid);
  if (item) {
    return item.tag;
  }

  return undefined;
}
