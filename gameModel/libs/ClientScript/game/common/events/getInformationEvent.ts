import { SimDuration, TranslationKey } from "../baseTypes";
import { ActionEvent } from "./eventTypes";
import { FullEvent } from "./eventUtils";

export interface GetInformationEvent extends ActionEvent {

	messageKey: TranslationKey;
	actionNameKey: TranslationKey;
	durationSec: SimDuration;
}
