import { MapToSuperTypeNames } from '../typeDefinitions/definition';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { ActionTemplateDataController, TriggerDataController } from './dataController';

// TODO add map entities controller
export type ControllerType = TriggerDataController | ActionTemplateDataController;
export type RootCategories = MapToSuperTypeNames<FlatTrigger | FlatActionTemplate>;

export function getController(rootType: RootCategories): ControllerType {
  switch (rootType) {
    case 'trigger':
      return getTriggerController();
    case 'action':
      return getActionTemplateController();
    // TODO map entities
  }
}

let triggerController: TriggerDataController | undefined;
let actionTplController: ActionTemplateDataController | undefined;

export function getTriggerController(): TriggerDataController {
  return (triggerController =
    triggerController || new TriggerDataController('triggers_data', 'trigger'));
}

export function getActionTemplateController(): ActionTemplateDataController {
  return (actionTplController =
    actionTplController || new ActionTemplateDataController('action_template_data', 'action'));
}

// Reset the controllers when saving scripts or restarting the game
// comment if you want to keep controller's state while working
Helpers.registerEffect(() => {
  triggerController = undefined;
  actionTplController = undefined;
});
