import {
  ActionTemplateDataController,
  MapEntityController,
  TriggerDataController,
} from './dataController';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { FlatMapEntity } from '../typeDefinitions/mapEntityDefinition';

export type ControllerType =
  | TriggerDataController
  | ActionTemplateDataController
  | MapEntityController;
export type RootCategories = (FlatTrigger | FlatActionTemplate | FlatMapEntity)['superType'];

export function getController(rootType: RootCategories): ControllerType {
  switch (rootType) {
    case 'trigger':
      return getTriggerController();
    case 'action':
      return getActionTemplateController();
    case 'mapEntity':
      return getMapEntityController();
  }
}

let triggerController: TriggerDataController | undefined;
let actionTplController: ActionTemplateDataController | undefined;
let mapEntityController: MapEntityController | undefined;

export function getTriggerController(): TriggerDataController {
  return (triggerController = triggerController || new TriggerDataController('triggers_data'));
}

export function getActionTemplateController(): ActionTemplateDataController {
  return (actionTplController =
    actionTplController || new ActionTemplateDataController('action_template_data'));
}

// XGO TODO right var key and ctx key
export function getMapEntityController(): MapEntityController {
  return (mapEntityController = mapEntityController || new MapEntityController('triggers_data'));
}

// Reset the controllers when saving scripts or restarting the game
// comment if you want to keep controller's state while working
Helpers.registerEffect(() => {
  triggerController = undefined;
  actionTplController = undefined;
});

export function getAllControllers(): ControllerType[] {
  return [getTriggerController(), getActionTemplateController(), getMapEntityController()];
}
