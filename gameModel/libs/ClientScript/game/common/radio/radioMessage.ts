import { ActionType } from '../actionType';
import { ActorId, SimTime } from '../baseTypes';

// immutable
export interface RadioMessage {
  senderId: Readonly<ActorId> | undefined;
  senderName: Readonly<string> | undefined;
  recipientId: Readonly<ActorId> | undefined;
  timeStamp: Readonly<SimTime>;
  message: Readonly<string>;
  uid: number;
  isRadioMessage: boolean;
  channel: ActionType | undefined;
  pending: boolean | undefined;
}
