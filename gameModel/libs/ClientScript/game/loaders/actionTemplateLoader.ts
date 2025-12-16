import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { initActionTemplates, IUniqueActionTemplates } from '../actionTemplatesData';
import { ActionTemplateBase } from '../common/actions/actionTemplateBase';
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
    actionTemplates: { ...customActionTemplates, ...baseActionTemplates },
    uniqueActionTemplates,
  };
}

function initCustomActionTemplates(): ActionTemplateData['actionTemplates'] {
  const result: Record<Uid, ActionTemplateBase> = {};

  const actionTemplateDescriptors = Variable.find(gameModel, ACTION_TEMPLATE_DATA);
  const data = Object.values(parseObjectDescriptor<TemplateDescriptor>(actionTemplateDescriptors));

  let actionTemplate: ActionTemplateBase;
  data.forEach(actTemplateDescr => {
    actionTemplate = createInstance(actTemplateDescr);
    result[actionTemplate.uid] = actionTemplate;
  });

  return result;
}
