import { ActorId, SimDuration, SimTime, TemplateRef, TranslationKey } from "../baseTypes";
import { initBaseEvent } from "../events/baseEvent";
import { FullEvent } from "../events/eventUtils";
import { ActionEvent, EventPayload } from "../events/eventTypes";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { ActionBase, DefineMapObjectAction, GetInformationAction } from "./actionBase";
import { GetInformationEvent } from "../events/getInformationEvent";
import { DefineMapObjectEvent } from "../events/defineMapObjectEvent";
import { LocalEventBase, PlanActionLocalEvent } from "../localEvents/localEventBase";
import { Actor } from "../actors/actor";


/**
 * Action template
 * This object is the descriptor of an action it represents the data of an action
 * It can create local events that will in turn create actions
 */
export abstract class ActionTemplateBase<ActionT extends ActionBase = ActionBase, EventT extends EventPayload = EventPayload, LocalEventT extends LocalEventBase = LocalEventBase> {

  public constructor(protected readonly title: TranslationKey, protected readonly description: TranslationKey) {}

  /**
   * a deterministic unique identifier for this template
   */
  public abstract getTemplateRef(): TemplateRef;

  /**
   * Build an instance from an incoming global event
   */
  protected abstract createActionFromEvent(event: FullEvent<EventT>): ActionT;

  /**
   * Generate an event to be broadcasted
   * @param timeStamp current time
   * @param initiator the actor that initiates this action and will be its owner
   */
  public abstract buildGlobalEvent(timeStamp: SimTime, initiator: Actor, params: any): EventT;// TODO polymorphic params ?

  /**
   * Generate a local event to create an action from a broadcasted global event
   * @param globalEvent the broadcasted event
   */
  public abstract buildLocalEvent(globalEvent: FullEvent<EventT>): LocalEventT;

  /**
   * 
   * @param state the current game state
   * @param actor currently selected actor
   * @returns true if the player can trigger this action
   */
  public abstract isAvailable(state : MainSimulationState, actor : Actor): boolean;

  /**
   * @returns A translation to a short description of the action
   */
  public abstract getDescription(): TranslationKey;
  /**
   * @returns A translation to the title of the action
   */
  public abstract getTitle(): TranslationKey;

  protected initBaseEvent(timeStamp: SimTime, actorId: ActorId) : ActionEvent {
    return {
      ...initBaseEvent(actorId),
      type: 'ActionEvent',
      templateRef: this.getTemplateRef(),
      timeStamp : timeStamp,
    }
  }

}

// TODO move to own file
/**
 * Get some information
 */
export class GetInformationTemplate extends ActionTemplateBase<GetInformationAction, GetInformationEvent, PlanActionLocalEvent> {
  
  constructor(title: TranslationKey, description: TranslationKey, 
    readonly duration: SimDuration, readonly message: TranslationKey) {
    super(title, description);
  }

  protected createActionFromEvent(event: FullEvent<GetInformationEvent>): GetInformationAction {
    const payload = event.payload;
    // for historical reasons characterId could be of type string, cast it to ActorId (number)
    const ownerId = payload.emitterCharacterId as ActorId; 
    return new GetInformationAction(payload.timeStamp, this.duration, this.message, this.title , event.id, ownerId);
  }

  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor, params: any) : GetInformationEvent {
    // TODO figure out params polymorphism
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec : this.duration,
    }
  }

  public buildLocalEvent(globalEvent: FullEvent<GetInformationEvent>): PlanActionLocalEvent {
    const action = this.createActionFromEvent(globalEvent);
    return new PlanActionLocalEvent(globalEvent.id, globalEvent.payload.timeStamp, action);
  }

  public getTemplateRef(): TemplateRef {
    return 'GetInformationTemplate' + '_' + this.title;
  }


  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
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

/**
 * 
 */
export class DefineMapObjectTemplate extends ActionTemplateBase<DefineMapObjectAction, DefineMapObjectEvent, LocalEventBase> {
  
  
  public buildGlobalEvent(timeStamp: SimTime, initiator: Actor, params: any): DefineMapObjectEvent {
    throw new Error("Method not implemented.");
  }
  
  public buildLocalEvent(globalEvent: FullEvent<DefineMapObjectEvent>): LocalEventBase {
    throw new Error("Method not implemented.");
  }

  public getTemplateRef(): string {
    throw new Error("Method not implemented.");
  }

  protected createActionFromEvent(event: FullEvent<DefineMapObjectEvent>): DefineMapObjectAction {
    throw new Error("Method not implemented.");
  }

  public isAvailable(state: MainSimulationState, actor: Actor): boolean {
    throw new Error("Method not implemented.");
  }
  public getDescription(): string {
    throw new Error("Method not implemented.");
  }
  public getTitle(): string {
    throw new Error("Method not implemented.");
  }

}