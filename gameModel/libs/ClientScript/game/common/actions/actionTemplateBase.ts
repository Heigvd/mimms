import { InterventionRole } from "../actors/interventionRole";
import {  TranslationKey } from "../baseTypes";
import { BaseEvent, initEmitterIds } from "../events/baseEvent";
import { FullEvent } from "../events/eventUtils";
import { EventPayload } from "../events/eventTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ActionBase, GetInformationAction } from "./actionBase";
import { GetInformationEvent } from "../events/getInformationEvent";
import { TimeSliceDuration } from "../constants";

/**
 * Action template
 * This object is the descriptor of an action it represents the data of an action
 */
export abstract class ActionTemplateBase<ActionType extends ActionBase, EventType extends EventPayload> {

  protected readonly Title: TranslationKey;
  protected readonly Description: TranslationKey;

  // TODO constructor, certainly from static scenarist's config
  // includes descriptition title
  public constructor(title: TranslationKey, description: TranslationKey) {
    this.Description = description;
    this.Title= title;
  }

  /**
   * Build an instance from an incoming event payload
   */
  public abstract instanciateFromEvent(event: FullEvent<EventType>): ActionType;

  /**
   * Generate an event to be broadcasted
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
    return new GetInformationAction(payload.timeStamp, payload.durationSec, payload.messageKey, this.Title , event.id);
  }

  public buildEvent(params: any) : GetInformationEvent {
    // TODO figure out params polymorphism
    return {
      ...initEmitterIds(),
      messageKey : 'todo',
      actionNameKey : 'todo',
      timeStamp : 0,
      durationSec : TimeSliceDuration * 3
    }
  }

  public isAvailable(state: MainSimulationState, role: InterventionRole): boolean {
    return true;
    throw new Error("Method not implemented.");
  }
  public getDescription(): string {
    throw new Error("Method not implemented.");
  }
  public getTitle(): string {
    throw new Error("Method not implemented.");
  }


}