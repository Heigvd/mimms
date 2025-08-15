import { Uid } from '../game/common/interfaces';
import { compareConditions, Condition } from '../game/common/triggers/condition';
import { TimeCondition } from '../game/common/triggers/implementation/timeCondition';
import { compareTriggers, saveTriggers, Trigger } from '../game/common/triggers/trigger';
import { getTriggers } from '../game/loaders/triggerLoader';
import { generateId } from '../tools/helper';
import { ValidationResult } from './typeDefinitions/definition';
import { getTriggerDefinition } from './typeDefinitions/triggerDefinition';

export interface TriggerConfigState {
  triggers: Record<Uid, Trigger>;
  selectedTrigger: Uid | undefined;
}

export function getInitialTriggerConfigState() {
  return {
    triggers: getTriggers(),
    selectedTrigger: undefined,
  };
}

export function getTypedTriggerState(): TriggerConfigState {
  return Context.triggerConfig.state;
}

export function getSelectedTrigger(): Trigger | undefined {
  const selectedTriggerId = getTypedTriggerState().selectedTrigger;
  if (selectedTriggerId) {
    return getTypedTriggerState().triggers[selectedTriggerId];
  }

  return undefined;
}

export function reloadTriggersFromVariable(): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.triggers = Object.fromEntries(
    getTriggers().map(trigger => {
      return [trigger.uid, trigger];
    })
  );
  Context.triggerConfig.setState(newState);
}

export function saveTriggersToVariable(): void {
  saveTriggers(getTypedTriggerState().triggers);
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

export function setTriggerState(update: Partial<TriggerConfigState>): void {
  let newState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState = { ...newState, ...update };
  Context.triggerConfig.setState(newState);
}

/*** triggers ***/

export function getTriggersSorted(): Trigger[] {
  return Object.values(getTypedTriggerState().triggers).sort(compareTriggers);
}

export function selectTrigger(triggerUid: Uid) {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedTrigger = triggerUid;
  Context.triggerConfig.setState(newState);
}

export function unselectTrigger() {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedTrigger = undefined;
  Context.triggerConfig.setState(newState);
}

export function addTrigger(): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  const newTrigger: Trigger = {
    ...getTriggerDefinition().getDefault(),
    ...{ index: Object.values(newState.triggers).length },
  };
  newState.triggers[newTrigger.uid] = newTrigger;
  Context.triggerConfig.setState(newState);
}

export function deleteTrigger(): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedTrigger = undefined;
  delete newState.triggers[Context.trigger.uid];
  // TODO recompute indexes
  Context.triggerConfig.setState(newState);
}

export function updateCurrentTrigger(newData: Partial<Trigger>): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.triggers[newState.selectedTrigger!] = {
    ...(newState.triggers[newState.selectedTrigger!] as Trigger),
    ...newData,
  };
  Context.triggerConfig.setState(newState);
}

export function validateTrigger(trigger: Trigger): ValidationResult {
  return getTriggerDefinition().validator(trigger);
}

/*** conditions ***/

export function getConditionsSorted(): Condition[] {
  return (getSelectedTrigger()?.conditions ?? []).sort(compareConditions);
}

export function addFakeTimeCondition(): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  const conditions = newState.triggers[newState.selectedTrigger!]!.conditions;
  const newData: TimeCondition = {
    type: 'time',
    uid: generateId(10),
    index: conditions.length,
    operator: '=',
    timeSeconds: 0,
  };
  newState.triggers[newState.selectedTrigger!]!.conditions.push(newData);
  Context.triggerConfig.setState(newState);
}

export function updateCurrentCondition(newData: any): void {
  // TODO si on change le type, supprimer toutes les données intrinsèques.
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  const conditions = newState.triggers[newState.selectedTrigger!]!.conditions;
  const condIndex = conditions.findIndex((cond: Condition) => cond.uid === Context.condition.uid);
  newState.triggers[newState.selectedTrigger!]!.conditions[condIndex] = {
    ...conditions[condIndex],
    ...newData,
  };
  Context.triggerConfig.setState(newState);
}

export function deleteCondition(): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  const conditions = newState.triggers[newState.selectedTrigger!]!.conditions;
  const condIndex = conditions.findIndex((cond: Condition) => cond.uid === Context.condition.uid);
  newState.triggers[newState.selectedTrigger!]!.conditions.splice(condIndex, 1);
  // TODO recompute indexes
  Context.triggerConfig.setState(newState);
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

export function validateTimeCondition(condition: TimeCondition): ValidationResult {
  // TODO make this compile and generalize: return getConditionDefinition(condition.type).validator(condition);
  let success: boolean = true;
  const messages: ValidationResult['messages'] = [];
  if (condition.timeSeconds < 0) {
    success = false;
    messages.push({
      logLevel: 'ERROR',
      message: 'The time cannot be negative',
      isTranslateKey: false,
    });
  }
  return { success, messages };
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
