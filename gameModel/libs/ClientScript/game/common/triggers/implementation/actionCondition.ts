import { triggerLogger } from '../../../../tools/logger';
import { ActionTemplateUid } from '../../baseTypes';
import { ANY_CHOICE } from '../../constants';
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
      if(condition.choiceRef === ANY_CHOICE){
        return evaluateActivable(state, condition.actionRef, condition.status);
      } else {
        return evaluateActivable(state, condition.choiceRef, condition.status);
      }
    case 'completed once':
      return hasCompletedOnceAction(state, condition.actionRef, condition.choiceRef);
    case 'never planned':
      return hasNoActionInTimeline(state, condition.actionRef, condition.choiceRef);
    case 'ongoing':
      return hasOngoingAction(state, condition.actionRef, condition.choiceRef);

    default:
      triggerLogger.error('Unknown status on condition', JSON.stringify(condition));
  }
  return false;
}
