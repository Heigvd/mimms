import { Uid } from '../../game/common/interfaces';
import { patchX } from '../../tools/helper';
import { getTriggerController } from '../controllers/controllerInstances';
import { TriggerFlatType } from '../controllers/dataController';
import { GenericScenaristInterfaceState } from './genericConfigFacade';

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
