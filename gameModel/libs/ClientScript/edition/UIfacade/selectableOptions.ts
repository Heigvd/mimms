import { InterventionRoleTypeArray, isPlayedByARealPlayer } from '../../game/common/actors/actor';
import { ActivationOperator } from '../../game/common/impacts/implementation/activationImpact';
import { DynamicInterventionRole } from '../../game/common/impacts/implementation/notificationImpact';
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

type ActorRolesOptions = { label: string; value: DynamicInterventionRole }[];

export function getActorRolesOptions(includeInitiator: boolean = false): ActorRolesOptions {
  const result: ActorRolesOptions = [];
  if (includeInitiator) {
    result.push({ label: 'Initiator', value: 'Initiator' });
  }
  return result.concat(
    InterventionRoleTypeArray.filter(role => isPlayedByARealPlayer(role)).map(role => {
      return { label: role, value: role };
    })
  );
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
