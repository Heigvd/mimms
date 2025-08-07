import { triggerLogger } from '../../../../tools/logger';
import { ActionTemplateId } from '../../baseTypes';
import {
  hasCompletedOnceAction,
  hasNoActionInTimeline,
  hasOngoingAction,
} from '../../simulationState/actionStateAccess';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ChoiceActionStatus, ConditionBase, evaluateActivable } from '../condition';

// TODO if easier, both action and choice conditions could be grouped

export interface ActionCondition extends ConditionBase {
  type: 'action';
  actionTemplateId: ActionTemplateId; // TODO see how to deal with Uid (string) vs ActionTemplateId (number)
  status: ChoiceActionStatus;
}

export function evaluateActionCondition(
  state: Readonly<MainSimulationState>,
  condition: ActionCondition
): boolean {
  switch (condition.status) {
    case 'active':
    case 'inactive':
      return evaluateActivable(state, String(condition.actionTemplateId), condition.status); // TODO remove String( ) if we can (regarding actionTemplateId type)

    case 'completed once':
      return hasCompletedOnceAction(state, condition.actionTemplateId);
    case 'never planned':
      return hasNoActionInTimeline(state, condition.actionTemplateId);
    case 'ongoing':
      return hasOngoingAction(state, condition.actionTemplateId);

    default:
      triggerLogger.warn('Unknown status', JSON.stringify(condition));
  }
  return false;
}
