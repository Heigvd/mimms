import { IDescriptor, Indexed, Parented, SuperTyped, Uid } from '../game/common/interfaces';
import { getTriggersVariable } from '../game/common/triggers/trigger';
import { getTriggersRecord } from '../game/loaders/triggerLoader';
import { saveToObjectDescriptor } from '../tools/WegasHelper';
import { flattenTrigger, recomposeTrigger, TRIGGER_GOD } from './triggerConfigController';
import { getConditionDefinition, toFlatCondition } from './typeDefinitions/conditionDefinition';
import { getImpactDefinition, toFlatImpact } from './typeDefinitions/impactDefinition';
import { getTriggerDefinition, toFlatTrigger } from './typeDefinitions/triggerDefinition';

export interface ConfigItem extends IDescriptor, Indexed, Parented, SuperTyped {}

export type ConfigItemSupertype = /*| 'actionTemplate'
  | 'choice'
  | 'effect'
  |*/ 'impact' | 'condition' | 'trigger';

export type ConfigKind = 'triggersConfig' /*| 'actionTemplatesConfig' | 'locationsConfig'*/;

export function getFlatData(kind: ConfigKind): Record<Uid, ConfigItem> {
  switch (kind) {
    case 'triggersConfig':
      return flattenTrigger(getTriggersRecord());
  }
}

export function saveDataToVariable(kind: ConfigKind, flatData: Record<Uid, ConfigItem>): void {
  switch (kind) {
    case 'triggersConfig':
      const triggers = recomposeTrigger(flatData);
      const triggerDataVariableDescr = getTriggersVariable();
      saveToObjectDescriptor(triggerDataVariableDescr, triggers);
      break;
  }
}

export function createNew(superType: ConfigItemSupertype, parentUid?: Uid): ConfigItem {
  switch (superType) {
    case 'trigger':
      return toFlatTrigger(getTriggerDefinition().getDefault(), TRIGGER_GOD);
    case 'condition':
      return toFlatCondition(getConditionDefinition('time').getDefault(), parentUid!);
    case 'impact':
      return toFlatImpact(getImpactDefinition('notification').getDefault(), parentUid!);
    default:
      return toFlatTrigger(getTriggerDefinition().getDefault(), TRIGGER_GOD);
  }
}
