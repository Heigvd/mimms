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
// ensures a subtype name is mapped the correct subtype
//type ImpactRecord = MapToRecordByType<Impact>;

export function getImpactDefinition(type: ImpactTypeName): ImpactDefinition {
  /*const defs: ImpactRecord = {
    notification: getNotificationImpactDef(),
    activation: {} as any, // TODO
    radio: {} as any, // TODO
    choice: {} as any // TODO
  };*/

  let definition: ImpactDefinition;
  switch (type) {
    case 'notification':
      definition = getNotificationImpactDef();
      break;
    case 'activation':
    case 'choice':
    case 'radio':
      definition = {} as any; // TODO !!
  }

  if (definition?.type !== type) {
    // TODO some error or warning
  }

  return definition;

  // ImpactRecord is technically a Record<ImpactTypeName, ImpactDefinition>
  // a better typing should be possible, but this cast is correct
  //return (defs as Record<ImpactTypeName, ImpactDefinition>)[type];
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
