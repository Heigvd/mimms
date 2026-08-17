import { ActorId, SimTime } from '../baseTypes';
import { RadioType } from './communicationType';

// immutable
export interface RadioMessage {
  senderId: Readonly<ActorId> | undefined;
  senderName: Readonly<string> | undefined;
  recipientId: Readonly<ActorId> | undefined;
  timeStamp: Readonly<SimTime>;
  message: ITranslatableContent;
  uid: number;
  isRadioMessage: boolean;
  channel: RadioType | undefined;
  pending: boolean | undefined;
}
