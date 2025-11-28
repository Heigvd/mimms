import { ChoiceDescriptor } from '../../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { Uid } from '../../../game/common/interfaces';
import { Condition } from '../../../game/common/triggers/condition';
import { ChoiceCondition } from '../../../game/common/triggers/implementation/choiceCondition';
import { getTriggerController } from '../../controllers/controllerInstances';
import {
  FlatCondition,
  getConditionDefinition,
  toFlatCondition,
} from '../../typeDefinitions/conditionDefinition';
import {
  ALL_CHOICES_OPTION_VALUE,
  AllChoiceOptionType,
  allChoicesOption,
  getChoicesOptions,
  getMatchingActionUid,
} from './selectableOptions';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// condition initialisation

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
// action and choice specificities

export function getConditionActionUid(condition: FlatCondition): Uid | undefined {
  if (condition.type === 'action') {
    if (condition.actionRef) {
      // TODO deal with awful type conversion (ActionTemplateId is a number, Uid is a string)
      return String(condition.actionRef);
    }
  } else if (
    condition.type === 'choice' &&
    condition.choiceRef &&
    condition.choiceRef !== ALL_CHOICES_OPTION_VALUE
  ) {
    return getMatchingActionUid(condition.choiceRef);
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

export function updateConditionActionRef(condition: FlatCondition, actionRef: string): void {
  if (getConditionActionUid(condition) === actionRef) {
    // no change => nothing to do
    return;
  }

  let newCondition: FlatCondition = { ...condition };

  // if it was a choice condition, change it to be an action condition
  if (newCondition.type !== 'action') {
    newCondition = changeTypeBetweenActionAndChoice(condition, 'action')!;
  }

  // cannot happen ... but you know ... make it compile ...
  if (newCondition.type !== 'action') {
    throw new Error('must be an action condition');
  }

  // TODO deal with awful type conversion (ActionTemplateId is a number, Uid is a string)
  newCondition.actionRef = Number(actionRef);

  getTriggerController().updateItem(newCondition);
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
      const newActionRef = getMatchingActionUid(condition.choiceRef);
      updateConditionActionRef(condition, newActionRef);
    }
  } else {
    let newCondition: FlatCondition = { ...condition };
    if (newCondition.type !== 'choice') {
      newCondition = changeTypeBetweenActionAndChoice(condition, 'choice')!;
    }

    // cannot happen ... but you know ... make it compile ...
    if (newCondition.type !== 'choice') {
      throw new Error('changing type did not work');
    }

    newCondition.choiceRef = choiceRef;

    getTriggerController().updateItem(newCondition);
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

  const newCondition: FlatCondition = createSubstitutionCondition(condition, newType);

  return newCondition;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
