import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { getTriggersVariable, Trigger } from '../common/triggers/trigger';

let triggerCache: Trigger[] | undefined;
Helpers.registerEffect(() => {
  // reset triggers on scripts reload
  resetTriggerCache();
});

export function resetTriggerCache(): void {
  triggerCache = undefined;
}

export function getTriggers(): Trigger[] {
  if (triggerCache) {
    return triggerCache;
  }

  const triggersVariable = getTriggersVariable();
  triggerCache = Object.values(parseObjectDescriptor<Trigger>(triggersVariable));

  triggerCache.forEach(t => {
    t.impacts = t.impacts.filter(i => i.type !== 'empty');
    t.conditions = t.conditions.filter(c => c.type !== 'empty');
  });
  return triggerCache;
}
