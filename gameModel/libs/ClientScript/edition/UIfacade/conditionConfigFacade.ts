import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
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
import {
  ALL_CHOICES_OPTION_VALUE,
  AllChoiceOptionType,
  allChoicesOption,
  getChoicesOptions,
} from './dataFetcher';

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
      label: 'trigger',
      value: 'trigger',
    },
    {
      label: 'action',
      value: 'action',
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

  if (
    'invert' in newItem &&
    isInvertDisplayed(newItem) &&
    'invert' in baseCondition &&
    isInvertDisplayed(baseCondition)
  ) {
    newItem.invert = baseCondition.invert;
  }

  if (
    'status' in newItem &&
    isActionCondition(newItem) &&
    'status' in baseCondition &&
    isActionCondition(baseCondition)
  ) {
    newItem.status = baseCondition.status;
  }

  return newItem;
}

function isInvertDisplayed(condition: FlatCondition): boolean {
  return condition?.type === 'action';
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

export function getConditionChoiceUid(
  condition: FlatCondition
): Uid | typeof ALL_CHOICES_OPTION_VALUE {
  return isActionCondition(condition) ? condition.choiceRef : ALL_CHOICES_OPTION_VALUE;
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
    if(getConditionActionUid(condition) !== actionRef){
      const newCondition = Helpers.cloneDeep(condition);
      newCondition.actionRef = actionRef;
      getTriggerController().updateItem(newCondition);
    }
  }else {
    scenarioEditionLogger.error('unexpected condition type');
  }

}

export function updateConditionChoiceRef(
  condition: FlatCondition,
  choiceRef: ActionCondition['choiceRef'] | typeof ALL_CHOICES_OPTION_VALUE
): void {
  if (isActionCondition(condition)) {
    if(condition.choiceRef !== choiceRef){
      const newCondition = Helpers.cloneDeep(condition);
      newCondition.choiceRef = choiceRef;
      getTriggerController().updateItem(newCondition);
    }
  } else {
    scenarioEditionLogger.error('unexpected condition type');
  }

}

function isActionCondition(condition: Condition): condition is ActionCondition {
  return condition?.type === 'action';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
