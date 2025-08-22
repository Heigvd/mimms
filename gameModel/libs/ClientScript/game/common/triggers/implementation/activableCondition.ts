import { Uid } from '../../interfaces';
import { ActivableStatus, ConditionBase } from '../condition';

export interface TriggerCondition extends ConditionBase {
  type: 'trigger';
  activableRef: Uid;
  status: ActivableStatus;
}

export interface MapEntityCondition extends ConditionBase {
  type: 'mapEntity';
  activableRef: Uid;
  status: ActivableStatus;
}
