import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { Effect } from '../../game/common/impacts/effect';
import { compareByIndex, compareByTag, Uid } from '../../game/common/interfaces';
import { MapEntityDescriptor } from '../../game/common/mapEntities/mapEntityDescriptor';
import { Trigger } from '../../game/common/triggers/trigger';
import {
  getActionTemplateController,
  getMapEntityController,
  getTriggerController,
} from '../controllers/controllerInstances';
import { FlatChoice } from '../typeDefinitions/choiceDefinition';
import { FlatEffect } from '../typeDefinitions/effectDefinition';
import { FlatMapEntity } from '../typeDefinitions/mapEntityDefinition';
import { FlatActionTemplate } from '../typeDefinitions/templateDefinition';
import { FlatTrigger } from '../typeDefinitions/triggerDefinition';

export function getMapEntitiesOptions(
  filterFn?: (mapEntity: FlatMapEntity) => boolean
): { label: string; value: MapEntityDescriptor['uid'] }[] {
  return Object.values(getMapEntityController().getFlatDataClone())
    .filter(item => item.superType === 'mapEntity')
    .map(mapEntity => mapEntity as FlatMapEntity)
    .filter(mapEntity => !filterFn || filterFn(mapEntity))
    .sort(compareByTag)
    .map(item => {
      return { label: item.tag, value: item.uid };
    });
}

export function getTriggersOptions(
  filterFn?: (trigger: FlatTrigger) => boolean
): { label: string; value: Trigger['uid'] }[] {
  return Object.values(getTriggerController().getFlatDataClone())
    .filter(item => item.superType === 'trigger')
    .map(trigger => trigger as FlatTrigger)
    .filter(trigger => !filterFn || filterFn(trigger))
    .sort(compareByTag)
    .map(item => {
      return { label: item.tag, value: item.uid };
    });
}

export function getActionTemplatesOptions(
  filterFn?: (actionTemplate: FlatActionTemplate) => boolean
): {
  label: string;
  value: TemplateDescriptor['uid'];
}[] {
  return Object.values(getActionTemplateController().getFlatDataClone())
    .filter(item => item.superType === 'action')
    .map(actionTemplate => actionTemplate as FlatActionTemplate)
    .filter(actionTemplate => !filterFn || filterFn(actionTemplate))
    .sort(compareByTag)
    .map(actionTemplate => {
      return { label: actionTemplate.tag, value: String(actionTemplate.uid) };
    });
}

export function getMatchingActionTemplateUid(
  choiceUid: FlatChoice['uid']
): FlatActionTemplate['uid'] {
  const choice = getChoice(choiceUid);
  return choice.parent;
}

function getChoice(choiceUid: FlatChoice['uid']): FlatChoice {
  const choice = getActionTemplateController().getFlatDataClone()[choiceUid];
  if (choice == undefined || choice.superType != 'choice') {
    throw Error('no choice matches uid ' + choiceUid);
  }
  return choice;
}

export const ALL_CHOICES_OPTION_VALUE = 'ALL_CHOICES_OPTION';
export type AllChoiceOptionType = { label: string; value: typeof ALL_CHOICES_OPTION_VALUE };
export const allChoicesOption: AllChoiceOptionType = {
  label: 'any choice',
  value: ALL_CHOICES_OPTION_VALUE,
};

export function getChoicesOptions(
  actionTemplateUid: TemplateDescriptor['uid'],
  filterFn?: (choice: FlatChoice) => boolean
): { label: string; value: ChoiceDescriptor['uid'] }[] {
  return Object.values(getActionTemplateController().getFlatDataClone())
    .filter(item => item.superType === 'choice')
    .map(choice => choice as FlatChoice)
    .filter(choice => choice.parent === actionTemplateUid)
    .filter(choice => !filterFn || filterFn(choice))
    .sort(compareByIndex)
    .map(item => {
      return { label: item.tag, value: item.uid };
    });
}

export function getEffectsOptions(
  choiceUid: Uid,
  filterFn?: (effect: FlatEffect) => boolean
): { label: string; value: Effect['uid'] }[] {
  return Object.values(getActionTemplateController().getFlatDataClone())
    .filter(item => item.superType === 'effect')
    .map(effect => effect as FlatEffect)
    .filter(effect => effect.parent === choiceUid)
    .filter(effect => !filterFn || filterFn(effect))
    .sort(compareByTag)
    .map(item => {
      return { label: item.tag, value: item.uid };
    });
}

export function getDefaultEffect(choiceUid: Uid): Effect['uid'] {
  const choice = getChoice(choiceUid);
  return choice.defaultEffect;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
