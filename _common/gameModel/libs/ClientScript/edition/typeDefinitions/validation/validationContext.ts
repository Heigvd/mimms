import { ActionTemplateConfigUIState } from '../../UIfacade/actionConfigFacade';
import { GenericScenaristInterfaceState } from '../../UIfacade/genericConfigFacade';
import { MapEntityUIState } from '../../UIfacade/locationConfigFacade';
import { Page } from '../../UIfacade/mainMenuStateFacade';
import { TriggerConfigUIState } from '../../UIfacade/triggerConfigFacade';
import { ValidationMessage } from '../definition';

export interface GenericValidationContext {
  page: Page | 'none';
  targetState?: GenericScenaristInterfaceState;
}

export type GenericValidationMessage = ValidationMessage<GenericValidationContext>;

export interface LocationValidationContext extends GenericValidationContext {
  page: 'locations';
  targetState: MapEntityUIState;
}

export type LocationValidationMessage = ValidationMessage<LocationValidationContext>;

export interface ActionValidationContext extends GenericValidationContext {
  page: 'actions';
  targetState: ActionTemplateConfigUIState;
}

export type ActionValidationMessage = ValidationMessage<ActionValidationContext>;

export interface TriggerValidationContext extends GenericValidationContext {
  page: 'triggers';
  targetState: TriggerConfigUIState;
}

export type TriggerValidationMessage = ValidationMessage<TriggerValidationContext>;

export type KnownValidationContext =
  | {
      page: Exclude<GenericValidationContext['page'], 'locations' | 'actions' | 'triggers'>;
      targetState: GenericValidationContext['targetState'];
    }
  | LocationValidationContext
  | ActionValidationContext
  | TriggerValidationContext;
