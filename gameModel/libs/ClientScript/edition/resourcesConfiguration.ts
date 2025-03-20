import { saveToObjectDescriptor } from '../tools/WegasHelper';

export function getContainerConfigurations() {
  const raw = Variable.find(gameModel, 'containers_config').getProperties();
  return Object.entries(raw).map(([key, value]) => {
    const parsed = JSON.parse(value);
    return { id: key, ...parsed };
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

function getContainerConfigurationsVariable() {
  const raw = Variable.find(gameModel, 'containers_config').getProperties();
  const containerConfigurations: any = {};
  Object.entries(raw).forEach(([key, value]) => {
    containerConfigurations[key] = JSON.parse(value);
  });
  return containerConfigurations;
}

export function updateValue(id: string, field: string, value: string | number) {
  const containerConfigurations = getContainerConfigurationsVariable();
  containerConfigurations[id][field] = value;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}

export function updateID(id: string, newId: string | number) {
  const containerConfigurations = getContainerConfigurationsVariable();
  const values = containerConfigurations[id];
  delete containerConfigurations[id];
  containerConfigurations[newId] = values;
  saveToObjectDescriptor(Variable.find(gameModel, 'containers_config'), containerConfigurations);
}
