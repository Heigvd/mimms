import { ActorId, SimTime } from "./baseTypes";

// immutable
export interface RadioMessage {
  recipientId: Readonly<ActorId>,
  timeStamp: Readonly<SimTime>,
  emitter: Readonly<string>,
  message: Readonly<string>
}