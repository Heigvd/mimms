import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { ANY_CHOICE } from '../../game/common/constants';
import { Uid } from '../../game/common/interfaces';
import { Condition } from '../../game/common/triggers/condition';
import { ActionCondition } from '../../game/common/triggers/implementation/actionCondition';
import { scenarioEditionLogger } from '../../tools/logger';
import { getTriggerController } from '../controllers/controllerInstances';
import {
  FlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../typeDefinitions/conditionDefinition';
import { AllChoiceOptionType, allChoicesOption, getChoicesOptions } from './dataFetcher';
import { updateItem } from './triggerConfigFacade';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// condition initialisation

export function getConditionTypeOptions(): { label: string; value: Condition['type'] }[] {
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
      label: 'action',
      value: 'action',
    },
    {
      label: 'trigger',
      value: 'trigger',
    },
  ];
}

// replace the condition by a new default one, but keep uid, parent and index
export function changeConditionType(
  condition: FlatCondition,
  newType: FlatCondition['type']
): void {
  if (condition.type !== newType) {
    const newCondition: FlatCondition = createSubstitutionCondition(condition, newType);
    getTriggerController().updateItem(newCondition);
  }
}

function createSubstitutionCondition(
  baseCondition: FlatCondition,
  newType: FlatCondition['type']
): FlatCondition {
  const newItem: FlatCondition = toFlatCondition(
    getConditionDefinition(newType).getDefault(),
    baseCondition.parent
  );

  newItem.uid = baseCondition.uid;
  newItem.index = baseCondition.index;

  return newItem;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// map specificities

export function canEnterShowOnMap(condition: FlatCondition): boolean {
  return condition?.type === 'mapEntity' && condition?.activableRef?.length > 0;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// action and choice specificities

export function getConditionActionUid(condition: FlatCondition): Uid | undefined {
  return isActionCondition(condition) ? condition.actionRef : undefined;
}

export function getEffectiveConditionChoicesOptions(
  condition: FlatCondition
): ({ label: string; value: ChoiceDescriptor['uid'] } | AllChoiceOptionType)[] {
  const actionTemplateUid: Uid | undefined = getConditionActionUid(condition);

  if (actionTemplateUid) {
    return [allChoicesOption, ...getChoicesOptions(actionTemplateUid)];
  }

  return [allChoicesOption];
}

export function updateConditionActionRef(
  condition: FlatCondition,
  actionRef: ActionCondition['actionRef']
): void {
  if (isActionCondition(condition)) {
    if (getConditionActionUid(condition) !== actionRef) {
      updateItem<FlatCondition>(condition.uid, { actionRef: actionRef, choiceRef: ANY_CHOICE });
    }
  } else {
    scenarioEditionLogger.error('unexpected condition type');
  }
}

function isActionCondition(condition: Condition): condition is ActionCondition {
  return condition?.type === 'action';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
