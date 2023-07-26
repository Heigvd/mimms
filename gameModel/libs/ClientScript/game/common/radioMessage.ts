import { ActorId, SimTime } from "./baseTypes";

// immutable
export interface RadioMessage {
  recipientId: Readonly<ActorId>,
  timeStamp: Readonly<SimTime>,
  message: Readonly<string>
}