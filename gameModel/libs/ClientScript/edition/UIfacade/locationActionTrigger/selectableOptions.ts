import { TemplateDescriptor } from '../../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../../../game/common/actions/choiceDescriptor/choiceDescriptor';
import {
  InterventionRole,
  InterventionRoleTypeArray,
  isPlayedByARealPlayer,
} from '../../../game/common/actors/actor';
import { Effect } from '../../../game/common/impacts/effect';
import { ActivationOperator } from '../../../game/common/impacts/implementation/activationImpact';
import { compareByIndex, compareByTag, Uid } from '../../../game/common/interfaces';
import { MapEntityDescriptor } from '../../../game/common/mapEntities/mapEntityDescriptor';
import { RadioType } from '../../../game/common/radio/communicationType';
import { ActivableStatus, ChoiceActionStatus } from '../../../game/common/triggers/condition';
import { TimeCondition } from '../../../game/common/triggers/implementation/timeCondition';
import { Trigger } from '../../../game/common/triggers/trigger';
import {
  getActionTemplateController,
  getMapEntityController,
  getTriggerController,
} from '../../controllers/controllerInstances';
import { FlatChoice } from '../../typeDefinitions/choiceDefinition';
import { FlatEffect } from '../../typeDefinitions/effectDefinition';
import { FlatMapEntity } from '../../typeDefinitions/mapEntityDefinition';
import { FlatActionTemplate } from '../../typeDefinitions/templateDefinition';
import { FlatTrigger } from '../../typeDefinitions/triggerDefinition';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// triggers

export function getTriggerOperatorSelection(): { label: string; value: Trigger['operator'] }[] {
  return [
    {
      label: 'AND',
      value: 'AND',
    },
    {
      label: 'OR',
      value: 'OR',
    },
  ];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// choices

export function getTimeOperatorSelection(): { label: string; value: TimeCondition['operator'] }[] {
  return [
    {
      label: 'smaller than',
      value: '<',
    },
    {
      label: 'equals',
      value: '=',
    },
    {
      label: 'bigger than',
      value: '>',
    },
  ];
}

export function getActiveInactiveStatusSelection(): { label: string; value: ActivableStatus }[] {
  return [
    {
      label: 'Inactive',
      value: 'inactive',
    },
    {
      label: 'Active',
      value: 'active',
    },
  ];
}

export function getChoiceActionStatusSelection(): { label: string; value: ChoiceActionStatus }[] {
  return [
    {
      label: 'Inactive',
      value: 'inactive',
    },
    {
      label: 'Active',
      value: 'active',
    },
    {
      label: 'Completed once',
      value: 'completed once',
    },
    {
      label: 'Ongoing',
      value: 'ongoing',
    },
    {
      label: 'Never planned',
      value: 'never planned',
    },
  ];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// impacts

export function getRadioSelection(): { label: string; value: keyof typeof RadioType }[] {
  return Object.values(RadioType).map(channel => {
    return { label: channel, value: channel };
  });
}

export function getRolesSelection(): { label: string; value: InterventionRole }[] {
  return InterventionRoleTypeArray.filter(role => isPlayedByARealPlayer(role)).map(role => {
    return { label: role, value: role };
  });
}

export function getActivateInactivateSelection(): { label: string; value: ActivationOperator }[] {
  return [
    {
      label: 'Inactivate',
      value: 'deactivate',
    },
    {
      label: 'Activate',
      value: 'activate',
    },
  ];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// data to fetch

export function getActionTemplatesOptions(filterFn?: (action: FlatActionTemplate) => boolean): {
  label: string;
  value: TemplateDescriptor['uid'];
}[] {
  return Object.values(getActionTemplateController().getFlatDataClone())
    .filter(item => item.superType === 'action')
    .map(action => action as FlatActionTemplate)
    .filter(action => !filterFn || filterFn(action))
    .sort(compareByTag)
    .map(actionTmplt => {
      return { label: actionTmplt.title, value: String(actionTmplt.uid) };
    });
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

export function getMatchingActionUid(choiceUid: FlatChoice['uid']): FlatActionTemplate['uid'] {
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
