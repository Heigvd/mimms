// By example

export function getConditionTypeChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'time',
      value: 'time',
    },
    {
      label: 'action',
      value: 'action',
    },
    {
      label: 'choice',
      value: 'choice',
    },
    {
      label: 'trigger',
      value: 'trigger',
    },
    {
      label: 'mapEntity',
      value: 'mapEntity',
    },
  ];
}

export function getTimeOperatorChoices(): { label: string; value: string }[] {
  return [
    {
      label: '<',
      value: '<',
    },
    {
      label: '=',
      value: '=',
    },
    {
      label: '>',
      value: '>',
    },
  ];
}
