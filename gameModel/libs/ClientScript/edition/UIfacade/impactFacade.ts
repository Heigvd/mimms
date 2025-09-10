// By example

export function getImpactTypeChoices(): { label: string; value: string }[] {
  return [
    {
      label: 'activation',
      value: 'activation',
    },
    {
      label: 'effectSelection',
      value: 'effectSelection',
    },
    {
      label: 'notification',
      value: 'notification',
    },
    {
      label: 'radio',
      value: 'radio',
    },
  ];
}
