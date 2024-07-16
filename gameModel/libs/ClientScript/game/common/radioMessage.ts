import { ActionType } from './actionType';
import { ActorId, SimTime, TranslationKey } from './baseTypes';

export type MessageId =number;

export const RadioMessageIdProvider: MessageId = 1;

// immutable
export interface RadioMessage {
  /** unique id */
  uid: MessageId;
  /** Time of the message */
  timeStamp: Readonly<SimTime>;
  /** Text to display */
  message: Readonly<string>;
  /** Readable name of the recipient */
  recipientName: Readonly<TranslationKey> | undefined;
  /** The recipient can be an actor or a non-playable person */
  recipientActorId: Readonly<ActorId> | undefined;
  /** Readable name of the emitter */
  emitterName: Readonly<TranslationKey> | undefined;
  /** The emitter can be an actor or a non-playable person */
  emitterActorId: Readonly<ActorId> | undefined;
  /** It is either a radio channel or a notification */
  isRadioMessage: boolean;
  /** Radio channel */
  channel: ActionType | undefined;
  /** A pending message will be sent on next time forward*/
  pending: boolean | undefined;
}
