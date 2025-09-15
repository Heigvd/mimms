import { Uid } from '../../game/common/interfaces';
import { patchX } from '../../tools/helper';
import { getTriggerController } from '../controllers/controllerInstances';
import { TriggerFlatType } from '../controllers/dataController';
import {
  FlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../typeDefinitions/conditionDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { GenericScenaristInterfaceState, getItems } from './genericConfigFacade';

export type TriggerConfigUIState = GenericScenaristInterfaceState;

export function getInitialTriggersUIState(): TriggerConfigUIState {
  return {
    selected: {},
  };
}

export function updateItem<T extends TriggerFlatType>(uid: Uid, newData: Partial<T>): void {
  const controller = getTriggerController();
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone();
  if (data[uid] != undefined) {
    data[uid] = patchX(data[uid], newData)!;
    controller.updateData(data);
  }
}

export function getTriggerOperatorChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'AND',
      value: 'AND',
    },
    {
      label: 'OR',
      value: 'OR',
    },
  ];
}

export function getDefaultTriggerOperatorChoice(): string {
  return 'AND';
}

export function getConditionTypeChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'time',
      value: 'time',
    },
    {
      label: 'action',
      value: 'action',
    },
    {
      label: 'choice',
      value: 'choice',
    },
    {
      label: 'trigger',
      value: 'trigger',
    },
    {
      label: 'mapEntity',
      value: 'mapEntity',
    },
  ];
}

// TODO better
export function updateConditionType(
  uid: FlatCondition['uid'],
  newType: FlatCondition['type']
): void {
  const controller = getTriggerController();
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone();
  const itemSaved: FlatCondition = { ...(data[uid] as FlatCondition) };
  if (data[uid] != undefined) {
    // replace the condition by a new default one, but keep uid, parent and index
    delete data[uid];
    const newData: FlatCondition = {
      ...toFlatCondition(getConditionDefinition(newType).getDefault(), itemSaved.parent),
      ...{ uid: itemSaved.uid, index: itemSaved.index },
    };
    data[newData.uid] = newData;
    controller.updateData(data);
  }
}

export function getTimeOperatorChoices(): { label: string; value: string }[] {
  return [
    {
      label: '<',
      value: '<',
    },
    {
      label: '=',
      value: '=',
    },
    {
      label: '>',
      value: '>',
    },
  ];
}

// TODO better
export function getTriggerChoices(omittedUid?: Uid): { label: string; value: string }[] {
  return getItems('trigger')
    .map(item => item as FlatTrigger)
    .filter(item => item.uid !== omittedUid)
    .map(item => {
      return { label: item.tag, value: item.uid };
    });
}

// TODO better
export function getTriggerTag(triggerUid: Uid): string | undefined {
  const item = getItems('trigger')
    .map(item => item as FlatTrigger)
    .find(item => item.uid === triggerUid);
  if (item) {
    return item.tag;
  }

  return undefined;
}

// TODO better
export function getActiveInactiveStatusChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'inactive',
      value: 'inactive',
    },
    {
      label: 'active',
      value: 'active',
    },
  ];
}

export function getImpactTypeChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'activation',
      value: 'activation',
    },
    {
      label: 'effectSelection',
      value: 'effectSelection',
    },
    {
      label: 'notification',
      value: 'notification',
    },
    {
      label: 'radio',
      value: 'radio',
    },
  ];
}
