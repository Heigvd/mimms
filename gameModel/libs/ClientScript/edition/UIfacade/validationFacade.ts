import {
  getActionTemplateController,
  getAllControllers,
  getMapEntityController,
  getTriggerController,
} from '../controllers/controllerInstances';
import { ActionTemplateConfigUIState } from '../UIfacade/actionConfigFacade';
import { TriggerConfigUIState } from '../UIfacade/triggerConfigFacade';
import { MapEntityUIState } from './locationConfigFacade';
import {
  getValidationMessages as getValidationMessagesFromUIState,
  setCurrentPage,
  setValidationMessages,
} from './mainMenuStateFacade';
import { KnownValidationContext } from '../typeDefinitions/validation/validationContext';
import { ValidationMessage } from '../typeDefinitions/definition';
import { hospitalValidator } from '../typeDefinitions/validation/hospitalValidation';
import { getHospitals } from '../../game/common/evacuation/hospitalController';
import { getPatientsBodyFactoryParams } from '../../tools/WegasHelper';
import { BodyFactoryParam } from '../../HUMAn/human';
import { patientValidator } from '../typeDefinitions/validation/patientValidation';
import { getMapConfig, MapConfig } from '../../gameMap/utils/mapConfig';
import { mapConfigValidator } from '../typeDefinitions/validation/mapConfigValidation';
import {
  ContainerConfigurationData,
  loadResourceContainersConfigurationData,
} from '../../game/loaders/resourceLoader';
import { resourceContainersValidator } from '../typeDefinitions/validation/resourceContainerValidation';
import { HospitalDefinition } from '../../game/common/evacuation/hospitalType';
import { scenarioEditionLogger } from '../../tools/logger';

//////////////////////////////////////////////////////////////////////////////////////
// UI state

export interface ValidationUIState {
  errorList: boolean;
  warningList: boolean;
}

export function getInitialValidationUIState(): ValidationUIState {
  return {
    errorList: true,
    warningList: false,
  };
}

/* toggle errors and warnings lists */
export function toggleErrorsListState(): void {
  const newState = Helpers.cloneDeep(Context.validationUIState.state);
  newState.errorList = !newState.errorList;
  Context.validationUIState.setState(newState);
}

export function getErrorListState(): boolean {
  return Context.validationUIState.state.errorList;
}

export function toggleWarningListState(): void {
  const newState = Helpers.cloneDeep(Context.validationUIState.state);
  newState.warningList = !newState.warningList;
  Context.validationUIState.setState(newState);
}

export function getWarningListState(): boolean {
  return Context.validationUIState.state.warningList;
}

//////////////////////////////////////////////////////////////////////////////////////
// get data

export function getValidationMessages(): ValidationMessage<any>[] {
  return getValidationMessagesFromUIState();
}

export function getValidationErrors(): ValidationMessage<any>[] {
  const validationMessages = getValidationMessages();
  return validationMessages.filter(vr => vr.level === 'ERROR');
}

export function getValidationWarnings(): ValidationMessage<any>[] {
  const validationMessages = getValidationMessages();
  return validationMessages.filter(vr => vr.level !== 'ERROR');
}

export function validationSummary(): string {
  if (getValidationErrors().length > 0) {
    return 'Oh no! Simulation not playable - ' + getValidationErrors().length + ' blocking errors';
  }
  if (getValidationErrors().length < 1 && getValidationWarnings().length > 1) {
    return (
      "Alright, but the simulation could run even smoother if it weren't for those " +
      getValidationWarnings().length +
      ' warning(s)'
    );
  }
  return 'Congratulations! Simulation is playable';
}

export function computeValidationMessages(): ValidationMessage<any>[] {
  scenarioEditionLogger.debug('compute validation');

  const result: ValidationMessage<any>[] = [];

  const mapConfig: MapConfig = getMapConfig();
  result.push(...mapConfigValidator(mapConfig, { page: 'map' }));

  const controllers = getAllControllers();
  for (const controller of controllers) {
    result.push(...controller.validate());
  }

  const patients: BodyFactoryParam[] = Object.values(getPatientsBodyFactoryParams());
  result.push(...patientValidator(patients, { page: 'patients' }));

  const hospitals: HospitalDefinition[] = Object.values(getHospitals());
  result.push(...hospitalValidator(hospitals, { page: 'hospitals' }));

  const resourceContainers: ContainerConfigurationData[] = Object.values(
    loadResourceContainersConfigurationData()
  );
  result.push(...resourceContainersValidator(resourceContainers, { page: 'resources' }));

  return result;
}

export function computeAndStoreValidationMessages(): void {
  const result: ValidationMessage<any>[] = computeValidationMessages();
  setValidationMessages(result);
}

export function clearValidationMessages(): void {
  setValidationMessages([]);
}

export function clickGoToButton(validationContext: KnownValidationContext): void {
  if (validationContext.page !== 'none') {
    setCurrentPage(validationContext.page);
  }

  if (validationContext.page === 'locations') {
    const newState: MapEntityUIState = Helpers.cloneDeep(
      getMapEntityController().getLatestIState()
    );
    if (validationContext.targetState.selectedFilter) {
      newState.selectedFilter = validationContext.targetState.selectedFilter;
    }
    newState.selected = { ...newState.selected, ...validationContext.targetState.selected };
    getMapEntityController().softUpdateIState(newState);
  } else if (validationContext.page === 'triggers') {
    const newState: TriggerConfigUIState = Helpers.cloneDeep(
      getTriggerController().getLatestIState()
    );
    newState.selected = { ...newState.selected, ...validationContext.targetState.selected };
    getTriggerController().softUpdateIState(newState);
  } else if (validationContext.page === 'actions') {
    const newState: ActionTemplateConfigUIState = Helpers.cloneDeep(
      getActionTemplateController().getLatestIState()
    );
    newState.selected = { ...newState.selected, ...validationContext.targetState.selected };
    getActionTemplateController().softUpdateIState(newState);
  }
}
