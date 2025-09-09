import { Classed, IDescriptor, Indexed, Parented } from '../game/common/interfaces';
import { Trigger } from '../game/common/triggers/trigger';
import { getTriggers } from '../game/loaders/triggerLoader';
import { ConfigStateType } from './UIfacade/genericConfigState';

const triggerGod = 'triggerGod';

export interface ConfigData extends Classed, IDescriptor, Indexed, Parented {}

export type ConfigDataKind =
  | 'actionTemplate'
  | 'choice'
  | 'effect'
  | 'impact'
  | 'condition'
  | 'trigger';

export type ConfigDataBaseKind = 'actionTemplate' | 'trigger';

export function getInitialState(kind: ConfigDataBaseKind): ConfigStateType {
  switch (kind) {
    case 'actionTemplate':
      break;
    case 'trigger':
      return flattenTrigger(getTriggers());
  }

  return [];
}

function flattenTrigger(triggersList: Trigger[]): ConfigStateType {
  const result: ConfigStateType = [];

  for (const trigger of triggersList) {
    for (const condition of trigger.conditions) {
      result.push({ ...condition, class: 'condition', parent: trigger.uid });
    }

    for (const impact of trigger.impacts) {
      result.push({ ...impact, class: 'impact', parent: trigger.uid });
    }

    const rawTrigger: Trigger = { ...trigger };
    // remove duplicated data
    rawTrigger.conditions = [];
    rawTrigger.impacts = [];

    result.push({ ...rawTrigger, class: 'trigger', parent: triggerGod });
  }

  return result;
}
