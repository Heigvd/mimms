import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { ACTION_TEMPLATE_DATA } from '../../game/loaders/actionTemplateLoader';
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

export function getController(page: Page): ControllerType {
  switch (page) {
    case 'triggers':
      return getTriggerController();
    case 'actions':
      return getActionTemplateController();
    case 'locations':
      return getMapEntityController();
  }

  const caller = new Error().stack;
  throw new Error('No controller exists for page ' + page + '; caller ' + caller);
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

function getInitialMapEntityUIState(): MapEntityUIState {
  return {
    selectedFilter: LOCATION_ENUM.chantier,
    selected: {},
    modal: 'closed',
    panel: true,
    onlySelected: false,
    drawActive: false,
    drawType: 'Point',
  };
}

function getInitialTriggerUIState(): TriggerConfigUIState {
  return {
    selected: {},
    modal: 'closed',
    viewOnMapItem: undefined,
  };
}

function getInitialActionTemplateUIState(): ActionTemplateConfigUIState {
  return {
    selected: {},
    modal: 'closed',
    viewOnMapItem: undefined,
    mapMarkerOn: {},
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
  return [getTriggerController(), getActionTemplateController(), getMapEntityController()];
}
