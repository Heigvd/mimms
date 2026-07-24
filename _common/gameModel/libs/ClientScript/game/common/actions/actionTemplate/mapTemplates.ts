
import { ActionTemplateUid, ActorId, SimDuration, TranslationKey } from '../../baseTypes';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { Actor, InterventionRole } from '../../actors/actor';
import { ChoiceDescriptor } from '../choiceDescriptor/choiceDescriptor';
import { FullEvent } from '../../events/eventUtils';
import { MapChoiceEvent } from '../../events/defineMapObjectEvent';
import { VehicleType } from '../../resources/resourceType';
import { ActionType } from '../../actionType';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import * as ActionLogic from '../actionLogic';
import { ChoiceTemplate, SimFlag } from './actionTemplateBase';
import { MapChoiceAction, ParkChoiceAction, PCChoiceAction, PCFrontChoiceAction } from '../mapActions';

export class MapChoiceActionTemplate<
  ActionT extends MapChoiceAction = MapChoiceAction
> extends ChoiceTemplate<MapChoiceAction, MapChoiceEvent, ChoiceDescriptor> {
  public readonly binding?: LOCATION_ENUM;

  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[],
    binding?: LOCATION_ENUM
  ) {
    super(
      uid,
      title,
      description,
      duration,
      1, // repeats forced to 1. No map action can be run twice
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices
    );
    this.binding = binding;
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    payload: ChoiceDescriptor
  ): MapChoiceEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: this.duration,
      choice: payload,
    };
  }

  protected createActionFromEvent(event: FullEvent<MapChoiceEvent>): MapChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new MapChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice,
      this.binding
    ) as ActionT;
  }

  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean {
    return !ActionLogic.hasBeenPlannedByOtherActor(state, this.uid, actor.Uid);
  }

  protected override customCanConcurrencyWiseBePlayed(
    state: Readonly<MainSimulationState>,
    actorUid: ActorId
  ): boolean {
    return !ActionLogic.hasBeenPlannedByOtherActor(state, this.uid, actorUid);
  }
}

export class PCFrontChoiceTemplate extends MapChoiceActionTemplate<PCFrontChoiceAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    binding: LOCATION_ENUM.pcFront,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices,
      binding
    );
  }

  protected override createActionFromEvent(event: FullEvent<MapChoiceEvent>): PCFrontChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new PCFrontChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice
    );
  }
}

export class PCChoiceTemplate extends MapChoiceActionTemplate<PCChoiceAction> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    binding: LOCATION_ENUM.PC,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices,
      binding
    );
  }

  protected override createActionFromEvent(event: FullEvent<MapChoiceEvent>): PCChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new PCChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice
    );
  }
}

export class ParkChoiceTemplate extends MapChoiceActionTemplate<ParkChoiceAction> {
  public declare readonly binding: LOCATION_ENUM.ambulancePark | LOCATION_ENUM.helicopterPark;
  public readonly vehicleType: VehicleType;

  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey | ITranslatableContent,
    description: TranslationKey | ITranslatableContent,
    duration: SimDuration,
    binding: LOCATION_ENUM.ambulancePark | LOCATION_ENUM.helicopterPark,
    vehicleType: VehicleType,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[],
    choices?: ChoiceDescriptor[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      requiredFlags,
      raisedFlags,
      availableToRoles,
      choices,
      binding
    );
    this.vehicleType = vehicleType;
  }

  protected override createActionFromEvent(event: FullEvent<MapChoiceEvent>): ParkChoiceAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new ParkChoiceAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      payload.choice,
      this.binding,
      this.vehicleType
    );
  }
}
