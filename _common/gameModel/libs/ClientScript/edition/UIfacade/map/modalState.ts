import { Uid } from '../../../game/common/interfaces';
import { scenarioEditionLogger } from '../../../tools/logger';
import { FlatChoice } from '../../typeDefinitions/choiceDefinition';
import { FlatCondition } from '../../typeDefinitions/conditionDefinition';
import { FlatImpact } from '../../typeDefinitions/impactDefinition';
import { getCurrentController, ModalState } from '../../UIfacade/genericConfigFacade';
import { ActionTemplateDataController } from '../../controllers/actionTemplateController';
import { TriggerDataController } from '../../controllers/triggerController';

export function isModalClosed(): boolean {
  return getCurrentController()?.getLatestIState()?.modal !== 'opened';
}

export function toggleShowOnMap(state: ModalState, targetMapEntity: Uid | undefined): void {
  const controller = getCurrentController();
  if (controller instanceof TriggerDataController) {
    const newState = Helpers.cloneDeep(controller.getLatestIState());
    newState.modal = state;
    newState.viewOnMapItem = targetMapEntity;
    controller.updateIState(newState);
  } else if (controller instanceof ActionTemplateDataController) {
    const newState = Helpers.cloneDeep(controller.getLatestIState());
    newState.modal = state;
    newState.viewOnMapItem = targetMapEntity;
    controller.updateIState(newState);
  } else {
    scenarioEditionLogger.warn('showOnMap called in inappropriate context');
  }
}

export function toggleShowOnMapFromImpact(impact: FlatImpact): void {
  if (impact?.type === 'mapActivation') {
    toggleShowOnMap('opened', impact.target);
  }
}

export function toggleShowOnMapFromCondition(condition: FlatCondition): void {
  if (condition?.type === 'mapEntity') {
    toggleShowOnMap('opened', condition.activableRef);
  }
}

// TODO use when MapMarker are implemented
export function toggleShowOnMapFromChoice(choice: FlatChoice): void {
  if (choice.displayedMapEntity) {
    toggleShowOnMap('opened', choice.displayedMapEntity);
  }
}
