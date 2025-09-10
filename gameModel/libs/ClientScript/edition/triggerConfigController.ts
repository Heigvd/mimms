import { Uid } from '../game/common/interfaces';
import { Trigger } from '../game/common/triggers/trigger';
import { scenarioEditionLogger } from '../tools/logger';
import { ConfigItem } from './genericConfigController';
import {
  FlatCondition,
  fromFlatCondition,
  toFlatCondition,
} from './typeDefinitions/conditionDefinition';
import { FlatImpact, fromFlatImpact, toFlatImpact } from './typeDefinitions/impactDefinition';
import { FlatTrigger, fromFlatTrigger, toFlatTrigger } from './typeDefinitions/triggerDefinition';

export const TRIGGER_GOD = 'TRIGGER_GOD';

export function flattenTrigger(input: Record<Uid, Trigger>): Record<Uid, ConfigItem> {
  const flattened: Record<Uid, ConfigItem> = {};
  Object.entries(input).forEach(([uid, trigger]) => {
    flattened[uid] = toFlatTrigger(trigger, TRIGGER_GOD);
    trigger.impacts.forEach(impact => {
      flattened[impact.uid] = toFlatImpact(impact, uid);
    });
    trigger.conditions.forEach(condition => {
      flattened[condition.uid] = toFlatCondition(condition, uid);
    });
  });
  return flattened;
}

export function recomposeTrigger(flattened: Record<Uid, ConfigItem>): Record<Uid, Trigger> {
  const tree: Record<Uid, Trigger> = {};
  // create triggers with empty impacts and conditions
  Object.values(flattened)
    .filter(element => element.superType === 'trigger')
    .map(e => e as FlatTrigger) // safe cast
    .forEach((trigger: FlatTrigger) => {
      tree[trigger.uid] = fromFlatTrigger(trigger);
    });

  // fill in conditions
  Object.values(flattened)
    .filter(elem => elem.superType === 'condition')
    .map(e => e as FlatCondition) // safe cast
    .forEach((element: FlatCondition) => {
      const parentTrigger = tree[element.parent];
      if (parentTrigger) {
        parentTrigger.conditions.push(fromFlatCondition(element));
      } else {
        scenarioEditionLogger.error('Found some orphan impact/condition in trigger data', element);
      }
    });

  // fill in impacts
  Object.values(flattened)
    .filter(elem => elem.superType === 'impact')
    .map(e => e as FlatImpact) // safe cast
    .forEach((element: FlatImpact) => {
      const parentTrigger = tree[element.parent];
      if (parentTrigger) {
        parentTrigger.impacts.push(fromFlatImpact(element));
      } else {
        scenarioEditionLogger.error('Found some orphan impact/condition in trigger data', element);
      }
    });

  return tree;
}
