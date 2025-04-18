import { Uid } from '../../interfaces';
import { ActivableStatus, ConditionBase } from '../condition';

export interface TriggerCondition extends ConditionBase {
  type: 'Trigger';
  triggerId: Uid;
  operator: ActivableStatus;
}
