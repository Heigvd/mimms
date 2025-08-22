import { Uid } from '../../interfaces';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import { ChoiceActionStatus, ConditionBase, evaluateActivable } from '../condition';

// TODO if easier, both action and choice conditions could be grouped

export interface ChoiceCondition extends ConditionBase {
  type: 'choice';
  choiceRef: Uid;
  //actionTemplateId: Uid; // TODO needed ?
  status: ChoiceActionStatus;
}

export function evaluateChoiceCondition(
  state: Readonly<MainSimulationState>,
  condition: ChoiceCondition
): boolean {
  switch (condition.status) {
    case 'active':
    case 'inactive':
      return evaluateActivable(state, condition.choiceRef, condition.status);

    // TODO timeline fetch and check status
    case 'completed once':
    case 'never planned':
    case 'ongoing':
  }
  return false;
}
