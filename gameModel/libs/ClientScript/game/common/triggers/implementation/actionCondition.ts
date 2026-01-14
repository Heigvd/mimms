import { triggerLogger } from '../../../../tools/logger';
import { ActionTemplateUid } from '../../baseTypes';
import { Uid } from '../../interfaces';
import {
  hasCompletedOnceAction,
  hasNoActionInTimeline,
  hasOngoingAction,
} from '../../simulationState/actionStateAccess';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ChoiceActionStatus, ConditionBase, evaluateActivable } from '../condition';


export interface ActionCondition extends ConditionBase {
  type: 'action';
  actionRef: ActionTemplateUid;
  choiceRef: Uid;
  status: ChoiceActionStatus;
}

export function evaluateActionCondition(
  state: Readonly<MainSimulationState>,
  condition: ActionCondition
): boolean {
  switch (condition.status) {
    case 'active':
    case 'inactive':
      return evaluateActivable(state, condition.actionRef, condition.status);
    case 'completed once':
      return hasCompletedOnceAction(state, condition.actionRef);
    case 'never planned':
      return hasNoActionInTimeline(state, condition.actionRef);
    case 'ongoing':
      return hasOngoingAction(state, condition.actionRef);

    default:
      triggerLogger.error('Unknown status', JSON.stringify(condition));
  }
  return false;
}
