import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { ACTION_TEMPLATE_DATA } from '../../game/loaders/actionTemplateLoader';
import { getMapConfig } from '../../gameMap/utils/mapConfig';
import { FlatMapEntity } from '../typeDefinitions/mapEntityDefinition';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';
import { ActionTemplateConfigUIState } from '../UIfacade/actionConfigFacade';
import { MapEntityUIState } from '../UIfacade/locationConfigFacade';
import { Page } from '../UIfacade/mainMenuStateFacade';
import { TriggerConfigUIState } from '../UIfacade/triggerConfigFacade';
import {
  ActionTemplateDataController,
  MapEntityController,
  TriggerDataController,
} from './dataController';

export type ControllerType =
  | TriggerDataController
  | ActionTemplateDataController
  | MapEntityController;
export type RootCategories = (FlatTrigger | FlatActionTemplate | FlatMapEntity)['superType'];

export function getController(page: Page): ControllerType | undefined {
  switch (page) {
    case 'triggers':
      return getTriggerController();
    case 'actions':
      return getActionTemplateController();
    case 'locations':
      return getMapEntityController();
  }

  return undefined;
}

let triggerController: TriggerDataController | undefined;
let actionTplController: ActionTemplateDataController | undefined;
let mapEntityController: MapEntityController | undefined;

export function getTriggerController(): TriggerDataController {
  return (triggerController =
    triggerController ||
    new TriggerDataController('triggers_data', 'triggerPageState', getInitialTriggerUIState()));
}

export function getActionTemplateController(): ActionTemplateDataController {
  return (actionTplController =
    actionTplController ||
    new ActionTemplateDataController(
      ACTION_TEMPLATE_DATA,
      'actionPageState',
      getInitialActionTemplateUIState()
    ));
}

export function getMapEntityController(): MapEntityController {
  return (mapEntityController =
    mapEntityController ||
    new MapEntityController('map_entity_data', 'mapEntityPageState', getInitialMapEntityUIState()));
}

export function getInitialMapEntityUIState(): MapEntityUIState {
  return {
    selectedFilter: LOCATION_ENUM.chantier,
    selected: {},
    modal: 'closed',
    panel: true,
    onlySelected: false,
    drawActive: false,
    drawType: 'Point',
    mapView: getMapConfig() || {},
  };
}

export function getInitialTriggerUIState(): TriggerConfigUIState {
  return {
    selected: {},
    modal: 'closed',
    viewOnMapItem: undefined,
  };
}

export function getInitialActionTemplateUIState(): ActionTemplateConfigUIState {
  return {
    selected: {},
    modal: 'closed',
    viewOnMapItem: undefined,
    mapMarkerOn: {},
    effectOpen: false,
    openBasic: true,
    openCustom: true,
  };
}

// Reset the controllers when saving scripts or restarting the game
// comment if you want to keep controller's state while working
Helpers.registerEffect(() => {
  triggerController = undefined;
  actionTplController = undefined;
  mapEntityController = undefined;
});

export function getAllControllers(): ControllerType[] {
  // Please keep the same sorting as in the config menu interface
  return [getMapEntityController(), getTriggerController(), getActionTemplateController()];
}
