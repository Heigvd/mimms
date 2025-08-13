import { Impact } from '../../game/common/impacts/impact';
import { NotificationMessageImpact } from '../../game/common/impacts/implementation/notificationImpact';
import { generateId } from '../../tools/helper';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  //MapToRecordByType,
  MapToTypeNames,
} from './definition';

type ImpactTypeName = MapToTypeNames<Impact>;
type ImpactDefinition = MapToDefinition<Impact>;

export function getImpactDefinition(type: ImpactTypeName): ImpactDefinition {
  let definition: ImpactDefinition;
  switch (type) {
    case 'notification':
      definition = getNotificationImpactDef();
      break;
    case 'activation':
    case 'choice':
    case 'radio':
      definition = {} as any; // TODO specific definitions!!
  }

  if (definition?.type !== type) {
    // TODO error or warning,
  }

  return definition;
}

function getNotificationImpactDef(): Definition<NotificationMessageImpact> {
  return {
    type: 'notification',
    validator: _impact => ({ success: true, messages: [] }), // TODO validation
    getDefault: () => ({
      type: 'notification',
      uid: generateId(10),
      delaySeconds: 0,
      message: '',
      index: 0,
      roles: {
        ACS: false,
        MCS: false,
        AL: false,
        CASU: false,
        EVASAN: false,
        LEADPMA: false,
      },
    }),
    view: {
      uid: { basic: 'hidden', advanced: 'visible', expert: 'editable' },
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      index: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      roles: {} as any, // TODO ALL_EDITABLE,
      type: ALL_EDITABLE,
    },
  };
}

// TODO other impact types
