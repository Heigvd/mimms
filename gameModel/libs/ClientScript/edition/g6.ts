//import { Impact } from "../game/common/impacts/impact";
import { Uid } from '../game/common/interfaces';
import { compareConditions, Condition } from '../game/common/triggers/condition';
import { TimeCondition } from '../game/common/triggers/implementation/timeCondition';
import { compareTriggers, saveTriggers, Trigger } from '../game/common/triggers/trigger';
import { getTriggersRecord } from '../game/loaders/triggerLoader';
import { generateId } from '../tools/helper';
import { ValidationResult } from './typeDefinitions/definition';
import { getTriggerDefinition } from './typeDefinitions/triggerDefinition';

export interface TriggerConfigState {
  triggers: Record<Uid, Trigger>;
  selectedTrigger: Uid | undefined;
}

export function getInitialTriggerConfigState() {
  return {
    triggers: getTriggersRecord(),
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
  newState.triggers = getTriggersRecord();
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
  //newState.conditions = Object.values(newState.triggers[triggerUid].conditions);
  //newState.impacts = Object.values(newState.triggers[triggerUid].impacts);
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
  //const triggers = newState.triggers;
  //delete triggers[Context.trigger.uid];
  delete newState.triggers[Context.trigger.uid];
  // TODO recompute indexes
  Context.triggerConfig.setState(newState);
}

export function updateCurrentTrigger(newData: Partial<Trigger>): void {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  const updatedTrigger: Trigger = {
    ...(newState.triggers[newState.selectedTrigger!] as Trigger),
    ...newData,
  };
  newState.triggers[newState.selectedTrigger!] = updatedTrigger;
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

// TODO voir quoi faire si on change le type. voir si on garde les données.

export function updateCurrentCondition(newData: any): void {
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
  //return getConditionDefinition(condition.type).validator(condition);
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

/*
export function selectCondition(conditionUid: Uid) {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedCondition = conditionUid;
  Context.triggerConfig.setState(newState);
}

export function unselectCondition() {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedCondition = undefined;
  Context.triggerConfig.setState(newState);
}*/

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
/*
export function selectImpact(impactUid: Uid) {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedImpact = impactUid;
  Context.triggerConfig.setState(newState);
}

export function unselectImpact() {
  const newState: TriggerConfigState = Helpers.cloneDeep(Context.triggerConfig.state);
  newState.selectedImpact = undefined;
  Context.triggerConfig.setState(newState);
}*/
