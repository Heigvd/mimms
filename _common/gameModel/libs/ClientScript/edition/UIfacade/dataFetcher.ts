import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { ANY_CHOICE } from '../../game/common/constants';
import { Effect } from '../../game/common/impacts/effect';
import { Uid } from '../../game/common/interfaces';
import { MapEntityDescriptor } from '../../game/common/mapEntities/mapEntityDescriptor';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { Trigger } from '../../game/common/triggers/trigger';
import { compareByIndex } from '../../tools/indexedSorting';
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
import { getItemTyped } from './genericConfigFacade';

export type MapEntitiesOptionType = { label: string; value: MapEntityDescriptor['uid'] }[];

export function getMapEntitiesOptionsForChoice(choice: ChoiceDescriptor): MapEntitiesOptionType {
  let binding: LOCATION_ENUM = LOCATION_ENUM.custom;

  const actionTemplate: FlatActionTemplate | undefined = getItemTyped('action', choice.parent);
  if (actionTemplate?.binding) {
    binding = actionTemplate.binding;
  }

  return getMapEntitiesOptions(binding);
}

export function getMapEntitiesOptions(expectedBinding?: LOCATION_ENUM): MapEntitiesOptionType {
  let filter: undefined | ((mapEntity: FlatMapEntity) => boolean) = undefined;
  if (expectedBinding) {
    filter = (mapEntity: FlatMapEntity) => mapEntity.binding === expectedBinding;
  }

  return internalGetMapEntitiesOptions(filter);
}

function internalGetMapEntitiesOptions(
  filterFn?: (mapEntity: FlatMapEntity) => boolean
): MapEntitiesOptionType {
  return Object.values(getMapEntityController().getFlatDataClone())
    .filter(item => item.superType === 'mapEntity')
    .map(mapEntity => mapEntity as FlatMapEntity)
    .filter(mapEntity => !filterFn || filterFn(mapEntity))
    .sort(compareByIndex)
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
    .sort(compareByIndex)
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
    .sort(compareByIndex)
    .map(actionTemplate => {
      return { label: actionTemplate.tag, value: actionTemplate.uid };
    });
}

export function getMatchingActionTemplateUid(
  choiceUid: FlatChoice['uid']
): FlatActionTemplate['uid'] | undefined {
  const choice = getActionTemplateController().getItem(choiceUid, 'choice');
  return choice?.parent;
}

export type AllChoiceOptionType = { label: string; value: typeof ANY_CHOICE };
export const allChoicesOption: AllChoiceOptionType = {
  label: 'any choice',
  value: ANY_CHOICE,
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
    .sort(compareByIndex)
    .map(item => {
      return { label: item.tag, value: item.uid };
    });
}

export function getDefaultEffect(choiceUid: Uid): Effect['uid'] | undefined {
  const choice = getActionTemplateController().getItem<FlatChoice>(choiceUid, 'choice');
  return choice?.defaultEffect;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
