import { ActionTemplateId } from '../../game/common/baseTypes';
import { Uid } from '../../game/common/interfaces';
import { debugGetAllActionTemplates } from '../../game/mainSimulationLogic';
import { patchX } from '../../tools/helper';
import { getTriggerController } from '../controllers/controllerInstances';
import { TriggerFlatType } from '../controllers/dataController';
import {
  FlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../typeDefinitions/conditionDefinition';
import { FlatImpact, getImpactDefinition, toFlatImpact } from '../typeDefinitions/impactDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { GenericScenaristInterfaceState, getItems } from './genericConfigFacade';

export type TriggerConfigUIState = GenericScenaristInterfaceState;

export function getInitialTriggersUIState(): TriggerConfigUIState {
  return {
    selected: {},
  };
}

// TODO merge into one function getMandatoryTriggers(mandatory : boolean)
export function getMandatoryTriggers(): FlatTrigger[] {
  return getItems('trigger')
    .filter(item => item.superType === 'trigger')
    .map(trigger => trigger as FlatTrigger)
    .filter(trigger => trigger.mandatory);
}

export function getCustomTriggers(): FlatTrigger[] {
  return getItems('trigger')
    .filter(item => item.superType === 'trigger')
    .map(trigger => trigger as FlatTrigger)
    .filter(trigger => !trigger.mandatory);
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
export function getTriggerSelection(omittedUid?: Uid): { label: string; value: string }[] {
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
export function getActionTemplateSelection(): { label: string; value: string }[] {
  // TODO make it work, see how to get the data
  // XGO @Sandra : we will either deserialize the actiontemplate descriptors variable
  // or retrieve the current state from the actionTemplate controller (design decision here)
  // I just put some random data now
  return [
    { label: 'Place PMA', value: 'id-placePMA' },
    { label: 'Look at the sky', value: 'id-lookatthesky' },
  ];
  /*return debugGetAllActionTemplates().map(actionTmplt => {
    return { label: actionTmplt.getTitle(), value: String(actionTmplt.Uid) };
  });*/
}

// TODO better
export function getActionTemplateTitle(actionTempltUid: ActionTemplateId): string | undefined {
  // TODO make it work
  const actionTmplt = debugGetAllActionTemplates().find(
    actionTmplt => actionTmplt.Uid === actionTempltUid
  );
  if (actionTmplt) {
    return actionTmplt.getTitle();
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

// TODO better
export function getChoiceActionStatusChoices(): { label: string; value: string }[] {
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
