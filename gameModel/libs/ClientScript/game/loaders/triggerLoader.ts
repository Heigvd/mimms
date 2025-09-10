import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { Uid } from '../common/interfaces';
import { getTriggersVariable, Trigger } from '../common/triggers/trigger';

export function getTriggersArray(): Trigger[] {
  const triggersVariable = getTriggersVariable();
  return Object.values(parseObjectDescriptor<Trigger>(triggersVariable));
}

export function getTriggersRecord(): Record<Uid, Trigger> {
  const triggersVariable = getTriggersVariable();
  return parseObjectDescriptor<Trigger>(triggersVariable);
}

/*
function getTestTriggers(): Record<Uid, Trigger> {
  return {
    'Test trigger UID here': {
      type: 'trigger',
      uid: 'Test trigger UID here',
      index: 0,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'Test Trigger',
      accessLevel: 'basic',
      mandatory: false,
      repeatable: false,
      operator: 'OR',
      conditions: [
        {
          uid: 'c1',
          index: 1,
          type: 'time',
          operator: '>',
          timeSeconds: 120,
        },
      ],

      impacts: [
        {
          type: 'notification',
          uid: 'i1',
          roles: {
            AL: true,
            ACS: false,
            CASU: false,
            EVASAN: false,
            LEADPMA: false,
            MCS: false,
          },
          delaySeconds: 60,
          message: 'Hey this is a trigger talking to you',
          index: 0,
        },
      ],
    },
    // RADIO IMPACT
    'Other test trigger UID here': {
      uid: 'Other test trigger UID here',
      type: 'trigger',
      index: 1,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'Test Trigger',
      accessLevel: 'basic',
      mandatory: false,
      repeatable: true,
      operator: 'AND',
      conditions: [
        {
          index: 1,
          uid: 'c2',
          type: 'time',
          operator: '>',
          timeSeconds: 60 * 10,
        },
        {
          index: 2,
          uid: 'c3',
          type: 'time',
          operator: '<',
          timeSeconds: 60 * 13,
        },
      ],

      impacts: [
        {
          type: 'radio',
          uid: 'i3',
          channel: RadioType.CASU,
          delaySeconds: 0,
          message: 'Triggers can talk in the radio too',
          index: 0,
        },
      ],
    },
    // zero timing
    'zero timing try': {
      uid: 'zero timing try',
      type: 'trigger',
      index: 2,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'Test Trigger timing',
      accessLevel: 'basic',
      mandatory: false,
      repeatable: false,
      operator: 'AND',
      conditions: [],
      impacts: [
        {
          type: 'notification',
          uid: 'i2',
          roles: {
            AL: true,
            ACS: false,
            CASU: false,
            EVASAN: false,
            LEADPMA: false,
            MCS: false,
          },
          delaySeconds: 0,
          message: "merci de placer l'ambulance",
          index: 0,
        },
      ],
    },
  };
}
*/
