import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { initActionTemplates, IUniqueActionTemplates } from '../actionTemplatesData';
import { ActionTemplateBase } from '../common/actions/actionTemplate/actionTemplateBase';
import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';
import { Uid } from '../common/interfaces';
import { createInstance } from './actionTemplateFactory';

// Move the initActionTemplates here and delete actionsTemplatesData
// use the factory to build action templates from scenario stored templates descriptors and let the rest be hardcoded

export const ACTION_TEMPLATE_DATA = 'action_template_data';

export interface ActionTemplateData {
  actionTemplates: Record<string, ActionTemplateBase>;
  uniqueActionTemplates: IUniqueActionTemplates;
}

export function loadActionTemplates(): ActionTemplateData {
  const { actionTemplates: baseActionTemplates, uniqueActionTemplates } = initActionTemplates();

  const customActionTemplates = initCustomActionTemplates();

  return {
    actionTemplates: { ...baseActionTemplates, ...customActionTemplates },
    uniqueActionTemplates,
  };
}

function initCustomActionTemplates(): ActionTemplateData['actionTemplates'] {
  const result: Record<Uid, ActionTemplateBase> = {};

  const data = Object.values(loadCustomActionTemplateDescriptors()).sort(
    compareActionTemplateDescriptors
  );

  let actionTemplate: ActionTemplateBase;
  data.forEach(actTemplateDescr => {
    actionTemplate = createInstance(actTemplateDescr);
    result[actionTemplate.uid] = actionTemplate;
  });

  return result;
}

export function loadCustomActionTemplateDescriptors(): Record<Uid, TemplateDescriptor> {
  const actionTemplateDescriptors = Variable.find(gameModel, ACTION_TEMPLATE_DATA);
  return parseObjectDescriptor<TemplateDescriptor>(actionTemplateDescriptors);
}

function compareActionTemplateDescriptors(a: TemplateDescriptor, b: TemplateDescriptor): number {
  const idxA = a.index + (a.mandatory ? 0 : 1000000);
  const idxB = b.index + (b.mandatory ? 0 : 1000000);

  if (idxA === idxB) {
    return a.uid.localeCompare(b.uid);
  }

  return idxA - idxB;
}
