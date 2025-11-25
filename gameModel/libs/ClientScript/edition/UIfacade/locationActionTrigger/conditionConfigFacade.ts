import { Uid } from '../../../game/common/interfaces';
import { Condition } from '../../../game/common/triggers/condition';
import { getTriggerController } from '../../controllers/controllerInstances';
import { TriggerFlatType } from '../../controllers/dataController';
import {
  FlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../../typeDefinitions/conditionDefinition';

export function getConditionTypeSelection(): { label: string; value: Condition['type'] }[] {
  return [
    {
      label: 'time',
      value: 'time',
    },
    {
      label: 'location',
      value: 'mapEntity',
    },
    {
      label: 'trigger',
      value: 'trigger',
    },
    {
      label: 'action',
      value: 'action',
    },
  ];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// impact initialisation

// replace the condition by a new default one, but keep uid, parent and index
export function changeConditionType(
  uid: FlatCondition['uid'],
  newType: FlatCondition['type']
): void {
  const controller = getTriggerController();
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone();

  if (data[uid]?.superType !== 'condition') {
    throw new Error(`UID ${uid} does not match any condition`);
  }

  const itemSaved: FlatCondition = data[uid] as FlatCondition;

  if (data[uid] != undefined) {
    delete data[uid];
  }

  const newData: FlatCondition = {
    ...toFlatCondition(getConditionDefinition(newType).getDefault(), itemSaved.parent),
    ...{ uid: itemSaved.uid, index: itemSaved.index },
  };

  data[newData.uid] = newData;
  controller.updateData(data);
}
