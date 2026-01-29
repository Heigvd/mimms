import { Uid } from "../../game/common/interfaces";
import { ActionTemplateFlatType, MapEntityFlatType, SuperTypeNames, TriggerFlatType } from "../controllers/dataController";

// @Sandra I picked selection but I don't really like it, feel free to change it
export type ValidationContext = {
  selection : Partial<Record<SuperTypeNames, Uid>>;
}

export type LocationValidationContext = {
  selection: Partial<Record<MapEntityFlatType['superType'], Uid>>
}

export type ActionValidationContext = {
  selection: Partial<Record<ActionTemplateFlatType['superType'], Uid>>
}

export type TriggerValidationContext = {
  selection: Partial<Record<TriggerFlatType['superType'], Uid>>
}