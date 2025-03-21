import {
  ContainerConfigurationData,
  loadResourceContainersConfigurationData,
} from '../game/common/simulationState/loaders/resourceLoader';
import { generateId } from '../tools/helper';
import { saveToObjectDescriptor } from '../tools/WegasHelper';

export function getContainerConfigurations() {
  const data = loadResourceContainersConfigurationData();
  return Object.entries(data).map(([key, value]) => {
    return { id: key, ...value };
  });
}

interface UIState {
  edit: boolean;
}

export function getDefaultUIState(): UIState {
  return {
    edit: false,
  };
}

export function updateNumberValue(
  id: string,
  field: 'travelTime' | 'availabilityTime',
  value: number
) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const payload = containerConfigurations[id]!.payload;
  payload[field] = value;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}

export function updateStringValue(id: string, field: 'name' | 'type', value: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const payload = containerConfigurations[id]!.payload;
  payload[field] = value;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}

export function addContainerConfiguration() {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const newConfig: ContainerConfigurationData = {
    mandatory: false,
    payload: {
      name: 'unnamed',
      type: 'AMB-U',
      availabilityTime: 5,
      travelTime: 10,
    },
  };
  const id = generateId(10);
  containerConfigurations[id] = newConfig;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}

export function removeContainerConfiguration(id: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  delete containerConfigurations[id];
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}

export function toggleMandatory(id: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const config = containerConfigurations[id];
  if(config){
    config.mandatory = !config.mandatory;
    saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
  }
}
