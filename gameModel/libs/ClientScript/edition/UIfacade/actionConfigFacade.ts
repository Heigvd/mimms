import { Uid } from '../../game/common/interfaces';
import { patchX } from '../../tools/helper';
import { getActionTemplateController } from '../controllers/controllerInstances';
import { ActionTemplateFlatType } from '../controllers/dataController';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import { GenericScenaristInterfaceState, getItems, ModalState } from './genericConfigFacade';

//////////////////////////////////////////////////////////////////////////////////////
// UI state

export interface ActionTemplateConfigUIState extends GenericScenaristInterfaceState {
  modal: ModalState;
  viewOnMapItem?: Uid;
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

export function updateItem<T extends ActionTemplateFlatType>(uid: Uid, newData: Partial<T>): void {
  const controller = getActionTemplateController();
  const data: Record<Uid, ActionTemplateFlatType> = controller.getFlatDataClone();
  if (data[uid] != undefined) {
    data[uid] = patchX(data[uid], newData)!;
    controller.updateData(data);
  }
}

//////////////////////////////////////////////////////////////////////////////////////
