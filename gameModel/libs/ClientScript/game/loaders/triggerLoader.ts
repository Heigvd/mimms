import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { getTriggersVariable, Trigger } from '../common/triggers/trigger';

// FIXME if needed, change return type to Record<Uid, Trigger>
// XGO TODO singleton pattern (we don't wanna parse too often), reset the singleton with a useEffect
export function getTriggers(): Trigger[] {
  const triggersVariable = getTriggersVariable();
  const triggers = Object.values(parseObjectDescriptor<Trigger>(triggersVariable));

  triggers.forEach(t => {
    t.impacts = t.impacts.filter(i => i.type !== 'empty');
    t.conditions = t.conditions.filter(c => c.type !== 'empty');
  });
  return triggers;
}
