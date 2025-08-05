import { Uid } from '../../interfaces';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ChoiceActionStatus, ConditionBase, evaluateActivable } from '../condition';

// TODO if easier, both action and choice conditions could be grouped

export interface ActionCondition extends ConditionBase {
  type: 'action';
  actionTemplateId: Uid;
  status: ChoiceActionStatus;
}

export function evaluateActionCondition(
  state: MainSimulationState,
  condition: ActionCondition
): boolean {
  // TODO complete implementation

  switch (condition.status) {
    case 'active':
    case 'inactive':
      return evaluateActivable(state, condition.actionTemplateId, condition.status);

    // TODO timeline fetch and check
    case 'completed once':
    case 'never planned':
    case 'ongoing':
  }
  return false;
}
