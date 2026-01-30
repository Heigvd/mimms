import { ActionTemplateConfigUIState } from "../../UIfacade/actionConfigFacade";
import { GenericScenaristInterfaceState } from "../../UIfacade/genericConfigFacade";
import { MapEntityUIState } from "../../UIfacade/locationConfigFacade";
import { Page } from "../../UIfacade/mainMenuStateFacade";
import { TriggerConfigUIState } from "../../UIfacade/triggerConfigFacade";

export interface GenericValidationContext {
  page : Page | 'none';
  targetState? : GenericScenaristInterfaceState;
}

export interface LocationValidationContext extends GenericValidationContext {
  page: 'locations';
  targetState: MapEntityUIState;
}

//export type LocationValidationResult = ValidationResult<LocationValidationContext>;

export interface ActionValidationContext extends GenericValidationContext {
  page: 'actions';
  targetState: ActionTemplateConfigUIState;
}

//export type ActionValidationResult = ValidationResult<ActionValidationContext>;

export interface TriggerValidationContext extends GenericValidationContext  {
  page: 'triggers';
  targetState: TriggerConfigUIState
}

//export type TriggerValidationResult = ValidationResult<TriggerValidationContext>;
