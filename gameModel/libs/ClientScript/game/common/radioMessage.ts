import { ActionType } from './actionType';
import { ActorId, SimTime } from './baseTypes';

// immutable
export interface RadioMessage {
  recipientId: Readonly<ActorId>;
  timeStamp: Readonly<SimTime>;
  emitter: Readonly<string>;
  message: Readonly<string>;
  uid: number;
  isRadioMessage: boolean;
  channel: ActionType | undefined;
}
