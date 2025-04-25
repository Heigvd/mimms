import { Impact } from '../../game/common/impacts/impact';
import { NotificationMessageImpact } from '../../game/common/impacts/implementation/notificationImpact';
import {
  ALL_EDITABLE,
  Definition,
  MapToDefinition,
  MapToRecordByType,
  MapToTypeNames,
} from '../typeDefinitions/definition';

type ImpactTypeName = MapToTypeNames<Impact>;
type ImpactDefinition = MapToDefinition<Impact>;
// ensures a subtype name is mapped the correct subtype
type ImpactRecord = MapToRecordByType<Impact>;

export function getImpactDefinition(type: ImpactTypeName): ImpactDefinition {
  const defs: ImpactRecord = {
    notification: getNotificationImpactDef(),
    activation: {} as any, // TODO
    radio: {} as any, // TODO
  };

  // ImpactRecord is technically a Record<ImpactTypeName, ImpactDefinition>
  // a better typing should be possible, but this cast is correct
  return (defs as Record<ImpactTypeName, ImpactDefinition>)[type];
}

function getNotificationImpactDef(): Definition<NotificationMessageImpact> {
  return {
    type: 'notification',
    validator: _t => ({ success: true, messages: [] }), // TODO validation
    getDefault: () => ({
      type: 'notification',
      delaySeconds: 0,
      message: '',
      priority: 0,
      role: 'ACS',
      sender: 'Who is the sender',
    }),
    view: {
      delaySeconds: ALL_EDITABLE,
      message: ALL_EDITABLE,
      priority: { basic: 'hidden', advanced: 'editable', expert: 'editable' },
      role: ALL_EDITABLE,
      sender: ALL_EDITABLE,
      type: ALL_EDITABLE,
    },
  };
}

// TODO other impact types
