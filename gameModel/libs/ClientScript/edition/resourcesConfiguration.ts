import { optionalResourceDefinitions } from '../game/common/resources/resourceContainer';
import {
  ContainerConfigurationData,
  loadResourceContainersConfigurationData,
} from '../game/common/simulationState/loaders/resourceLoader';
import { generateId } from '../tools/helper';
import { saveToObjectDescriptor } from '../tools/WegasHelper';

export function getContainerConfigurations(mandatory: boolean) {
  const data = loadResourceContainersConfigurationData();
  const array = Object.entries(data).map(([key, value]) => {
    return { id: key, ...value };
  });
  const filtered = array.filter(config => config.mandatory === mandatory);
  if (!mandatory) {
    filtered.sort((a, b) => a.index - b.index);
  }
  return filtered;
}

type SortFunc = (a: ContainerConfigurationData, b: ContainerConfigurationData) => number;

function sortByType(a: ContainerConfigurationData, b: ContainerConfigurationData): number {
  const result = a.payload.type.localeCompare(b.payload.type);
  if (result === 0) {
    return a.payload.availabilityTime - b.payload.availabilityTime;
  }
  return result;
}

function sortByName(a: ContainerConfigurationData, b: ContainerConfigurationData): number {
  return a.payload.name.localeCompare(b.payload.name);
}

function sortByAvailabilityTime(
  a: ContainerConfigurationData,
  b: ContainerConfigurationData
): number {
  const result = a.payload.availabilityTime - b.payload.availabilityTime;
  if (result === 0) {
    return sortByType(a, b);
  }
  return result;
}

function sortByTravelTime(a: ContainerConfigurationData, b: ContainerConfigurationData): number {
  const result = a.payload.travelTime - b.payload.travelTime;
  if (result === 0) {
    return sortByType(a, b);
  }
  return result;
}

type SortAlgoType = 'travelTime' | 'name' | 'availabilityTime' | 'type';
let lastSortType: SortAlgoType | undefined = undefined;

export function getlastSortType() {
  return lastSortType;
}

const sortAlgorithms: Record<SortAlgoType, SortFunc> = {
  availabilityTime: sortByAvailabilityTime,
  name: sortByName,
  travelTime: sortByTravelTime,
  type: sortByType,
};

export function sortAndSave(sortAlgo: SortAlgoType): void {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const configs = Object.values(containerConfigurations);
  const sortFunc: SortFunc = sortAlgorithms[sortAlgo];
  lastSortType = sortAlgo;

  configs.sort(sortFunc);
  for (let i = 1; i < configs.length; i++) {
    configs[i].index = i;
  }
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
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
  lastSortType = undefined;
}

export function updateStringValue(id: string, field: 'name' | 'type', value: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const payload = containerConfigurations[id]!.payload;
  payload[field] = value;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
  lastSortType = undefined;
}

let lastAdded: string = '';

export function getLastAdded(): string {
  return lastAdded;
}

export function addContainerConfiguration() {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const newConfig: ContainerConfigurationData = {
    mandatory: false,
    index: 0,
    payload: {
      name: 'unnamed',
      type: '',
      availabilityTime: 0,
      travelTime: 0,
    },
  };
  const id = generateId(10);
  containerConfigurations[id] = newConfig;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
  lastSortType = undefined;
  lastAdded = id;
}

export function removeContainerConfiguration(id: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  delete containerConfigurations[id];
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}

export function toggleMandatory(id: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const config = containerConfigurations[id];
  if (config) {
    config.mandatory = !config.mandatory;
    saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
  }
  lastSortType = undefined;
}

export function getDefinitionChoices(): { label: string; value: string }[] {
  const advanced = Editor.getFeatures().ADVANCED;
  return Object.entries(optionalResourceDefinitions)
    .filter(([_, v]) => v || advanced)
    .map(([k, _]) => ({ label: k, value: k }));
}
