import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { Uid } from '../../game/common/interfaces';
import { Condition } from '../../game/common/triggers/condition';
import { ActionCondition } from '../../game/common/triggers/implementation/actionCondition';
import { ChoiceCondition } from '../../game/common/triggers/implementation/choiceCondition';
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
  getMatchingActionTemplateUid,
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
  if (condition.type === newType) {
    // no change => nothing to do
    return;
  }

  const newCondition: FlatCondition = createSubstitutionCondition(condition, newType);

  getTriggerController().updateItem(newCondition);
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
    (newItem.type === 'action' || newItem.type === 'choice') &&
    'status' in baseCondition &&
    (baseCondition.type === 'action' || baseCondition.type === 'choice')
  ) {
    newItem.status = baseCondition.status;
  }

  return newItem;
}

function isInvertDisplayed(condition: FlatCondition): boolean {
  return condition.type === 'action' || condition.type === 'choice';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// map specificities

export function canEnterShowOnMap(condition: FlatCondition): boolean {
  return condition?.type === 'mapEntity' && condition?.activableRef?.length > 0;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// action and choice specificities

export function getConditionActionUid(condition: FlatCondition): Uid | undefined {
  if (condition.type === 'action') {
    if (condition.actionRef) {
      return condition.actionRef;
    }
  } else if (
    condition.type === 'choice' &&
    condition.choiceRef &&
    condition.choiceRef !== ALL_CHOICES_OPTION_VALUE
  ) {
    return getMatchingActionTemplateUid(condition.choiceRef);
  }

  return undefined;
}

export function getConditionChoiceUid(
  condition: FlatCondition
): Uid | typeof ALL_CHOICES_OPTION_VALUE {
  if (condition.type === 'choice') {
    return condition.choiceRef;
  }

  return ALL_CHOICES_OPTION_VALUE;
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
  if (condition.type === 'action' && getConditionActionUid(condition) === actionRef) {
    // no change => nothing to do
    return;
  }

  let newCondition: FlatCondition = { ...condition };

  // if it was a choice condition, change it to be an action condition
  if (newCondition.type !== 'action') {
    newCondition = changeTypeBetweenActionAndChoice(condition, 'action')!;
  }

  // cannot happen ... but you know ... make it compile ...
  if (newCondition.type === 'action') {
    newCondition.actionRef = actionRef;

    getTriggerController().updateItem(newCondition);
  } else {
    scenarioEditionLogger.error('unexpected condition type');
  }
}

export function updateConditionChoiceRef(
  condition: FlatCondition,
  choiceRef: ChoiceCondition['choiceRef'] | typeof ALL_CHOICES_OPTION_VALUE
): void {
  if (getConditionChoiceUid(condition) === choiceRef) {
    // no change => nothing to do
    return;
  }

  if (choiceRef === ALL_CHOICES_OPTION_VALUE) {
    // all choice option is considered as an action condition
    if (
      condition.type === 'choice' &&
      condition.choiceRef &&
      condition.choiceRef !== ALL_CHOICES_OPTION_VALUE
    ) {
      // make it be an action condition
      const newActionRef = getMatchingActionTemplateUid(condition.choiceRef);
      updateConditionActionRef(condition, newActionRef);
    }
  } else {
    let newCondition: FlatCondition = { ...condition };
    if (newCondition.type !== 'choice') {
      // make it be a choice condition
      newCondition = changeTypeBetweenActionAndChoice(condition, 'choice')!;
    }

    // cannot happen ... but you know ... make it compile ...
    if (newCondition.type === 'choice') {
      newCondition.choiceRef = choiceRef;

      getTriggerController().updateItem(newCondition);
    } else {
      scenarioEditionLogger.error('unexpected condition type');
    }
  }
}

function changeTypeBetweenActionAndChoice(
  condition: FlatCondition,
  newType: FlatCondition['type'] & ('action' | 'choice')
): FlatCondition {
  if (condition.type === newType) {
    // no change => nothing to do
    return condition;
  }

  return createSubstitutionCondition(condition, newType);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
