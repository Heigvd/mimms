import { Uid } from '../../game/common/interfaces';
import { patchX } from '../../tools/helper';
import { scenarioEditionLogger } from '../../tools/logger';
import { getActionTemplateController } from '../controllers/controllerInstances';
import { ActionTemplateFlatType } from '../controllers/dataController';
import { FlatChoice } from '../typeDefinitions/choiceDefinition';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import {
  addNew,
  GenericScenaristInterfaceState,
  getItems,
  getItemTyped,
  ModalState,
} from './genericConfigFacade';

//////////////////////////////////////////////////////////////////////////////////////
// UI state

export interface ActionTemplateConfigUIState extends GenericScenaristInterfaceState {
  modal: ModalState;
  /**
   * Currently highlighted map entity
   */
  viewOnMapItem?: Uid;
  /**
   * Defines if a choice's map marker is on. This value is bypassed if this choice has a defined displayedMapEntity
   */
  mapMarkerOn: Record<Uid, boolean>;
}

//////////////////////////////////////////////////////////////////////////////////////
// get data

export function getActionTemplates(mandatory: boolean): FlatActionTemplate[] {
  return getItems('action')
    .filter(item => item.superType === 'action')
    .map(trigger => trigger as FlatActionTemplate)
    .filter(trigger => trigger.mandatory == mandatory);
}

//////////////////////////////////////////////////////////////////////////////////////
// update data

export function updateItem<T extends ActionTemplateFlatType>(
  uid: Uid,
  newData: Partial<T>,
  interfaceState: ActionTemplateConfigUIState | undefined = undefined,
  squashLastState: boolean = false
): void {
  const controller = getActionTemplateController();
  const data: Record<Uid, ActionTemplateFlatType> = controller.getFlatDataClone();
  if (data[uid] != undefined) {
    data[uid] = patchX(data[uid], newData)!;
    controller.updateData(data, true, interfaceState, squashLastState);
  }
}

//////////////////////////////////////////////////////////////////////////////////////
// check if in a mandatory action

export function isInMandatoryAction(item: ActionTemplateFlatType): boolean {
  if (item.superType === 'action') {
    return item.mandatory;
  }

  if (item.superType === 'choice') {
    const actTemplate = getItemTyped('action', item.parent);
    return actTemplate?.mandatory ?? false;
  }

  scenarioEditionLogger.warn(
    'Unexpected usage of isInMandatoryAction with superType ' + item.superType
  );

  return false;
}

//////////////////////////////////////////////////////////////////////////////////////
// map marker state handling

export function isMapMarkerOn(choice: FlatChoice): boolean {
  if (choice?.displayedMapEntity) {
    return true;
  }
  const storedMarkerState =
    getActionTemplateController()?.getLatestIState()?.mapMarkerOn[choice.uid];
  return storedMarkerState === undefined ? true : storedMarkerState;
}

export function updateMapMarkerState(choice: FlatChoice, activate: boolean): void {
  const state = getActionTemplateController().getLatestIState();
  const newState = Helpers.cloneDeep(state);
  newState.mapMarkerOn[choice.uid] = activate;
  if (choice.displayedMapEntity && !activate) {
    // reset the displayed map entity
    updateItem(choice.uid, { displayedMapEntity: undefined }, newState);
  } else {
    getActionTemplateController().updateIState(newState);
  }
}

export function canEnterShowOnMapChoice(choice: FlatChoice): boolean {
  return choice?.displayedMapEntity !== undefined;
}

//////////////////////////////////////////////////////////////////////////////////////
// effects specificities

export function addChoice(): void {
  const choice = addNew('choice', 'action');
  const effect = getActionTemplateController().createNew(choice.uid, 'effect', {
    squashLastState: true,
  });
  updateItem(effect.uid, { tag: 'Default effect' }, undefined, true);
  updateItem(choice.uid, { defaultEffect: effect.uid }, undefined, true);
}

//////////////////////////////////////////////////////////////////////////////////////
