import { Uid } from '../../interfaces';
import { ActivableStatus, ConditionBase } from '../condition';

export interface ActivableCondition extends ConditionBase {
  type: 'trigger' | 'mapEntity';
  activableRef: Uid;
  status: ActivableStatus;
}

export interface TriggerCondition extends ActivableCondition {
  type: 'trigger';
}

export interface MapEntityCondition extends ActivableCondition {
  type: 'mapEntity';
}
