import { Impact } from '../../game/common/impacts/impact';
import { NotificationMessageImpact } from '../../game/common/impacts/implementation/notificationImpact';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  //MapToRecordByType,
  MapToTypeNames,
} from '../typeDefinitions/definition';

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
      delaySeconds: 0,
      message: '',
      priority: 0,
      roles: {
        ACS: false,
        MCS: false,
        AL: false,
        CASU: false,
        EVASAN: false,
        LEADPMA: false,
      },
      sender: 'Scenarist', // likely not used at all
    }),
    view: {
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      priority: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      roles: {} as any, // TODO ALL_EDITABLE,
      sender: ALL_EDITABLE,
      type: ALL_EDITABLE,
    },
  };
}

// TODO other impact types
