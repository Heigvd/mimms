import { RadioType } from '../common/radio/communicationType';
import { Trigger } from '../common/triggers/trigger';

export function loadTriggers(): Trigger[] {
  // TODO load from WEGAS variable
  // instantiate triggers status structures
  return getTestTriggers();
}

function getTestTriggers(): Trigger[] {
  return [
    {
      priority: 0,
      active: true,
      conditions: [
        {
          type: 'Time',
          operator: '>',
          timeSeconds: 120,
        },
      ],
      impacts: [
        {
          type: 'notification',
          role: 'AL',
          delaySeconds: 60,
          message: 'Hey this is a trigger talking to you',
        },
      ],
      operator: 'OR',
      repeatable: false,
      tag: 'Test Trigger',
      uid: 1234,
    },
    // RADIO IMPACT
    {
      priority: 0,
      active: true,
      conditions: [
        {
          type: 'Time',
          operator: '>',
          timeSeconds: 60 * 10,
        },
        {
          type: 'Time',
          operator: '<',
          timeSeconds: 60 * 13,
        },
      ],
      impacts: [
        {
          type: 'radio',
          canal: RadioType.CASU,
          delaySeconds: 0,
          message: 'Triggers can talk in the radio too',
        },
      ],
      operator: 'AND',
      repeatable: true,
      tag: 'Test Trigger',
      uid: 1234,
    },
  ];
}
