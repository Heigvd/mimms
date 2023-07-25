import { SimDuration } from "../baseTypes";
import { ActionEvent } from "./eventTypes";

export interface DefineMapObjectEvent extends ActionEvent {
  durationSec: SimDuration;
  position : {
    x: number,
    y: number
  }
}