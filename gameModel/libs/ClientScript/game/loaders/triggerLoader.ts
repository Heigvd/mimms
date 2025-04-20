import { RadioType } from '../common/radio/communicationType';
import { Trigger } from '../common/triggers/trigger';

export function loadTriggers(): Trigger[] {
  // TODO load from WEGAS variable
  return getTestTriggers();
}

function getTestTriggers(): Trigger[] {
  return [
    {
      type: 'trigger',
      activableType: 'trigger',
      activeAtStart: true,
      priority: 0,
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
          sender: 'SENDER',
          delaySeconds: 60,
          message: 'Hey this is a trigger talking to you',
        },
      ],
      operator: 'OR',
      repeatable: false,
      tag: 'Test Trigger',
      uid: 'Test trigger UID here',
    },
    // RADIO IMPACT
    {
      type: 'trigger',
      activableType: 'trigger',
      activeAtStart: true,
      priority: 0,
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
      uid: 'Other test trigger UID here',
    },
  ];
}
