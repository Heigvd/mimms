import { InterventionRole } from "../actors/interventionRole";
import { TimeSliceDuration, TranslationKey } from "../baseTypes";
import { BaseEvent, initEmitterIds } from "../events/baseEvent";
import { FullEvent } from "../events/EventManager";
import { EventPayload, GetInformationEvent } from "../events/eventTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ActionBase, GetInformationAction } from "./actionBase";

/**
 * Action template
 * This object is the descriptor of an action it represents the data of an action
 */
export abstract class ActionTemplateBase<ActionType extends ActionBase, EventType extends EventPayload> {

  // TODO constructor, certainly from static scenarist's config
  // includes descriptition title

  /**
   * Build an instance from an incoming event payload
   */
  public abstract instanciateFromEvent(event: FullEvent<EventType>): ActionType;

  /**
   * Generate a event to be broadcasted
   */
  public abstract buildEvent(params: any): EventType;// TODO params

  /**
   * 
   * @param state game state
   * @param role currently selected role
   * @returns true if the player can trigger this action
   */
  public abstract isAvailable(state : MainSimulationState, role : InterventionRole): boolean;

  /**
   * @returns A translation to a short description of the action
   */
  public abstract getDescription(): TranslationKey;
  /**
   * @returns A translation to the title of the action
   */
  public abstract getTitle(): TranslationKey;

}

// TODO move to own file
export class GetInformationTemplate extends ActionTemplateBase<GetInformationAction, GetInformationEvent> {

  public instanciateFromEvent(event: FullEvent<GetInformationEvent>): GetInformationAction {
    const payload = event.payload;
    return new GetInformationAction(payload.timeStamp, payload.durationSec, payload.messageKey, event.id);
  }

  public buildEvent(params: any) : GetInformationEvent {
    // TODO figure out params polymorphism
    return {
      ...initEmitterIds(),
      messageKey : 'todo',
      timeStamp : 0,
      durationSec : TimeSliceDuration * 3
    }
  }

  public isAvailable(state: MainSimulationState, role: InterventionRole): boolean {
    throw new Error("Method not implemented.");
  }
  public getDescription(): string {
    throw new Error("Method not implemented.");
  }
  public getTitle(): string {
    throw new Error("Method not implemented.");
  }


}