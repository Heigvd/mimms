import {
  InterventionRole,
  InterventionRoleTypeArray,
  isPlayedByARealPlayer,
} from '../../game/common/actors/actor';
import { ActivationOperator } from '../../game/common/impacts/implementation/activationImpact';
import { RadioType } from '../../game/common/radio/communicationType';
import { ActivableStatus, ChoiceActionStatus } from '../../game/common/triggers/condition';
import { TimeCondition } from '../../game/common/triggers/implementation/timeCondition';
import { Trigger } from '../../game/common/triggers/trigger';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// triggers

export function getTriggerOperatorOptions(): { label: string; value: Trigger['operator'] }[] {
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

export function getTimeOperatorOptions(): { label: string; value: TimeCondition['operator'] }[] {
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

export function getActiveInactiveStatusOptions(): { label: string; value: ActivableStatus }[] {
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

export function getActionChoiceStatusOptions(): { label: string; value: ChoiceActionStatus }[] {
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

export function getRadioChannelOptions(): { label: string; value: keyof typeof RadioType }[] {
  return Object.values(RadioType).map(channel => {
    return { label: channel, value: channel };
  });
}

export function getActorRolesOptions(): { label: string; value: InterventionRole }[] {
  return InterventionRoleTypeArray.filter(role => isPlayedByARealPlayer(role)).map(role => {
    return { label: role, value: role };
  });
}

export function getActivateInactivateOptions(): { label: string; value: ActivationOperator }[] {
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
