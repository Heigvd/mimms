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
  // Purposefully not sorted
  if (!mandatory) {
    filtered.sort((a, b) => a.index - b.index);
  }
  return filtered;
}

type CompareFunc = (a: ContainerConfigurationData, b: ContainerConfigurationData) => number;

function compareByName(a: ContainerConfigurationData, b: ContainerConfigurationData): number {
  return a.payload.name.localeCompare(b.payload.name);
}

function compareByType(a: ContainerConfigurationData, b: ContainerConfigurationData): number {
  return (
    a.payload.type.localeCompare(b.payload.type) ||
    a.payload.availabilityTime - b.payload.availabilityTime ||
    compareByName(a, b)
  );
}

function compareByTravelTime(a: ContainerConfigurationData, b: ContainerConfigurationData): number {
  return a.payload.travelTime - b.payload.travelTime || compareByType(a, b);
}

function compareByAvailabilityTime(
  a: ContainerConfigurationData,
  b: ContainerConfigurationData
): number {
  return a.payload.availabilityTime - b.payload.availabilityTime || compareByType(a, b);
}

type SortAlgoType = 'travelTime' | 'name' | 'availabilityTime' | 'type';
let lastSortType: SortAlgoType | undefined = undefined;

export function getlastSortType() {
  return lastSortType;
}

const sortAlgorithms: Record<SortAlgoType, CompareFunc> = {
  availabilityTime: compareByAvailabilityTime,
  name: compareByName,
  travelTime: compareByTravelTime,
  type: compareByType,
};

export function sortAndSave(sortAlgo: SortAlgoType): void {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const configs = Object.values(containerConfigurations);
  const sortFunc: CompareFunc = sortAlgorithms[sortAlgo];
  lastSortType = sortAlgo;

  configs.sort(sortFunc);
  for (let i = 0; i < configs.length; i++) {
    const c = configs[i];
    if (c?.index !== undefined) {
      c.index = i;
    }
  }
  persistAll(containerConfigurations);
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
  persistAll(containerConfigurations);
  lastSortType = undefined;
}

export function updateStringValue(id: string, field: 'name' | 'type', value: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const payload = containerConfigurations[id]!.payload;
  payload[field] = value;
  persistAll(containerConfigurations);
  lastSortType = undefined;
}

let lastAdded: string = '';
let lastIndex: number = -1;

export function getLastAdded(): string {
  return lastAdded;
}

export function addContainerConfiguration() {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const newConfig: ContainerConfigurationData = {
    mandatory: false,
    index: lastIndex--,
    payload: {
      name: 'unnamed',
      type: '',
      availabilityTime: 0,
      travelTime: 0,
    },
  };
  const id = generateId(10);
  containerConfigurations[id] = newConfig;
  persistAll(containerConfigurations);
  lastSortType = undefined;
  lastAdded = id;
}

export function removeContainerConfiguration(id: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  delete containerConfigurations[id];
  persistAll(containerConfigurations);
}

export function toggleMandatory(id: string) {
  const containerConfigurations = loadResourceContainersConfigurationData();
  const config = containerConfigurations[id];
  if (config) {
    config.mandatory = !config.mandatory;
    persistAll(containerConfigurations);
  }
  lastSortType = undefined;
}

// In advanced mode, all types. In normal mode, only optional types
export function getContainerTypesChoices(): { label: string; value: string }[] {
  const advanced = Editor.getFeatures().ADVANCED;
  return Object.entries(optionalResourceDefinitions)
    .filter(([_, v]) => v || advanced)
    .map(([k, _]) => ({ label: k, value: k }));
}

function persistAll(containerConfigurations: Record<string, ContainerConfigurationData>): void {
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}
