import {
  ActionTemplateBase,
  CasuMessageTemplate,
  EvacuationActionTemplate,
  MoveActorActionTemplate,
  MoveResourcesAssignTaskActionTemplate,
  PretriageReportTemplate,
  SelectionFixedMapEntityTemplate,
  SendRadioMessageTemplate,
} from './actionTemplateBase';

export function isFixedMapEntityTemplate(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate instanceof SelectionFixedMapEntityTemplate;
}

export function isCasuMessageActionTemplate(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate instanceof CasuMessageTemplate;
}

export function isRadioActionTemplate(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate instanceof SendRadioMessageTemplate;
}

export function isMoveResourcesAssignTaskActionTemplate(
  actionTemplate: ActionTemplateBase
): boolean {
  return actionTemplate instanceof MoveResourcesAssignTaskActionTemplate;
}

export function isMoveActorActionTemplate(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate instanceof MoveActorActionTemplate;
}

export function isEvacuationActionTemplate(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate instanceof EvacuationActionTemplate;
}

export function isPretriageReportTemplate(actionTemplate: ActionTemplateBase): boolean {
  return actionTemplate instanceof PretriageReportTemplate;
}
