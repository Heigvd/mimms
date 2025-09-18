import { Uid } from '../../game/common/interfaces';
import { patchX } from '../../tools/helper';
import { getTriggerController } from '../controllers/controllerInstances';
import { TriggerFlatType } from '../controllers/dataController';
import {
  FlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../typeDefinitions/conditionDefinition';
import { FlatImpact, getImpactDefinition, toFlatImpact } from '../typeDefinitions/impactDefinition';
import { getActivableOfType } from '../UIfacade/activableFacade';
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

export interface UiConditionChoices {
  label: string;
  value: string;
  isItemOfType: (item: TriggerFlatType) => boolean;
  changeType: (uid: TriggerFlatType['uid']) => void;
}

export const uiConditionSelection: UiConditionChoices[] = [
  {
    label: 'time',
    value: 'time',
    isItemOfType: (item: TriggerFlatType) => item.type === 'time',
    changeType: (uid: Uid) => {
      updateConditionType(uid, 'time');
    },
  },

  {
    label: 'action',
    value: 'action',
    isItemOfType: (item: TriggerFlatType) => item.type === 'action' || item.type === 'choice',
    changeType: (uid: Uid) => {
      updateConditionType(uid, 'action');
    },
  },
  {
    label: 'trigger',
    value: 'trigger',
    isItemOfType: (item: TriggerFlatType) => item.type === 'trigger',
    changeType: (uid: Uid) => {
      updateConditionType(uid, 'trigger');
    },
    /*},
  {
    label: 'map entity',
    value: 'mapEntity',
    isItemOfType: (item: TriggerFlatType) => item.type === 'mapEntity',
    changeType: (uid: Uid) => { updateConditionType(uid, 'mapEntity') }*/
  },
];

export function getConditionSelection(): { label: string; value: string }[] {
  return uiConditionSelection.map(({ label, value }) => {
    return { label, value };
  });
}

// TODO better
export function isOfConditionType(
  condition: FlatCondition,
  cType: UiConditionChoices['value']
): boolean {
  switch (cType) {
    case 'time':
      return condition.type === 'time';
    case 'action':
      return condition.type === 'action' || condition.type === 'choice';
    case 'trigger':
      return condition.type === 'trigger';
    case 'mapEntity':
      return condition.type === 'mapEntity';
    default:
      return false;
  }
}

export function fromUItypeToDataType(cType: UiConditionChoices['value']): FlatCondition['type'] {
  switch (cType) {
    case 'time':
      return 'time';
    case 'action':
      return 'action';
    case 'trigger':
      return 'trigger';
    case 'mapEntity':
      return 'mapEntity';
  }
  return 'empty';
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

// TODO better
// good luck for action > choice > effect. The type field is not enough to know if it is an ActivationImpact or a ChoiceEffectSelectionImpact
export function updateImpactType(uid: FlatImpact['uid'], newType: FlatImpact['type']): void {
  const controller = getTriggerController();
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone();
  const itemSaved: FlatImpact = { ...(data[uid] as FlatImpact) };
  if (data[uid] != undefined) {
    // replace the impact by a new default one, but keep uid, parent and index
    delete data[uid];
    const newData: FlatImpact = {
      ...toFlatImpact(getImpactDefinition(newType).getDefault(), itemSaved.parent),
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
export function getChoiceSelection(actionTemplateId: Uid): { label: string; value: string }[] {
  const choices = getActivableOfType('choice');
  // TODO make it work, see how to get the data
  return Object.values(choices)
    .filter(choice => choice.parent === actionTemplateId)
    .map(choice => {
      return { label: choice.tag, value: String(choice.uid) };
    });
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

// TODO better
export function getChoiceActionStatusSelection(): { label: string; value: string }[] {
  return [
    {
      label: 'inactive',
      value: 'inactive',
    },
    {
      label: 'active',
      value: 'active',
    },
    {
      label: 'completed once',
      value: 'completed once',
    },
    {
      label: 'ongoing',
      value: 'ongoing',
    },
    {
      label: 'never planned',
      value: 'never planned',
    },
  ];
}

export function getImpactTypeSelection(): { label: string; value: string }[] {
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

// TODO make it dynamic
export function getRadioSelection(): { label: string; value: string }[] {
  return [
    {
      label: 'CASU',
      value: 'CASU',
    },
    {
      label: 'ACTORS',
      value: 'ACTORS',
    },
    {
      label: 'RESOURCES',
      value: 'RESOURCES',
    },
    {
      label: 'EVASAN',
      value: 'EVASAN',
    },
  ];
}

// TODO make it dynamic
// Do not forget to kick out CASU
export function getRolesSelection(): { label: string; value: string }[] {
  // return Object.keys(notificationImpact.roles).map(role => { return { label: role, value: role } });
  return [
    {
      label: 'ACS',
      value: 'ACS',
    },
    {
      label: 'MCS',
      value: 'MCS',
    },
    {
      label: 'AL',
      value: 'AL',
    },
    /*{
        label: 'CASU', value: 'CASU',
 },*/ {
      label: 'EVASAN',
      value: 'EVASAN',
    },
    {
      label: 'LEADPMA',
      value: 'LEADPMA',
    },
  ];
}
