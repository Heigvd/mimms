import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { getTriggersVariable, Trigger } from '../common/triggers/trigger';

// FIXME if needed, change return type to Record<Uid, Trigger>
// XGO TODO singleton pattern (we don't wanna parse too often), reset the singleton with a useEffect
export function getTriggers(): Trigger[] {
  const triggersVariable = getTriggersVariable();
  const triggers = Object.values(parseObjectDescriptor<Trigger>(triggersVariable));

  triggers.forEach(t => {
    t.impacts = t.impacts.filter(i => i.type !== 'empty');
    t.conditions = t.conditions.filter(c => c.type !== 'empty');
  });
  return triggers;

  // return getTestTriggers();
}

/*
function getTestTriggers(): Trigger[] {
  return [
    {
      type: 'trigger',
      uid: 'T0 trigger',
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
          operator: '=',
          timeSeconds: 0,
        },
      ],

      impacts: [
        {
          type: 'notification',
          uid: 'T0 notif',
          roles: {
            AL: true,
            ACS: false,
            CASU: false,
            EVASAN: false,
            LEADPMA: false,
            MCS: false,
          },
          delaySeconds: 0,
           {
            EN: 'I am a T=0 trigger',
            FR: 'Je suis un trigger T=0',
          },
          index: 0,
        },
      ],
    },
    {
      type: 'trigger',
      uid: 'Test trigger UID here',
      index: 0,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'Test Trigger',
      accessLevel: 'basic',
      mandatory: false,
      deactivateItself: true,
      operator: 'OR',
      conditions: [
        {
          uid: 'c1',
          index: 1,
          type: 'time',
          operator: '=',
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
          message: {
            EN: 'Hey this is a trigger talking to you',
            FR: 'Salut, un trigger vous parle',
          },
          index: 0,
        },
      ],
    },
    // RADIO IMPACT
    {
      uid: 'Other test trigger UID here',
      type: 'trigger',
      index: 1,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'Test Trigger',
      accessLevel: 'basic',
      mandatory: false,
      deactivateItself: false,
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
          message: {
            EN: 'Triggers can talk in the radio too',
            FR: 'Les triggers peuvent aussi vous parler à la radio',
          },
          index: 0,
        },
      ],
    },
    // zero timing
    {
      uid: 'zero timing try',
      type: 'trigger',
      index: 2,
      activableType: 'trigger',
      activeAtStart: true,
      tag: 'Test Trigger timing',
      accessLevel: 'basic',
      mandatory: false,
      deactivateItself: true,
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
          message: { EN: 'please park the ambulance', FR: "merci de placer l'ambulance" },
          index: 0,
        },
      ],
    },
  ];
}
*/
