import { ActionTemplateUid, ActorId, SimDuration, SimTime, TranslationKey } from '../../baseTypes';
import { Actor, InterventionRole } from '../../actors/actor';
import { ActionType } from '../../actionType';
import { FullEvent } from '../../events/eventUtils';
import { AppointActorEvent, MoveActorEvent, StandardActionEvent } from '../../events/eventTypes';
import { LOCATION_ENUM } from '../../simulationState/locationState';
import { MainSimulationState } from '../../simulationState/mainSimulationState';
import * as ActionLogic from '../actionLogic';
import { SimFlag, StartEndTemplate } from './actionTemplateBase';
import { AppointActorAction, CustomDurationAction, MoveActorAction } from '../actorActions';
import { TimeSliceDuration } from '../../constants';
import { getTranslation } from '../../../../tools/translation';

export class MoveActorActionTemplate extends StartEndTemplate {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    repeats: number = 0,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      repeats,
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<MoveActorEvent>): MoveActorAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new MoveActorAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      [],
      payload.location
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: LOCATION_ENUM
  ): MoveActorEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      location: params,
    };
  }
}

/**
 * Appoints a new actor if necessary conditions are met
 *
 */
export class AppointActorActionTemplate extends StartEndTemplate<
  AppointActorAction,
  AppointActorEvent,
  InterventionRole
> {
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    duration: SimDuration,
    readonly hierarchyNotRespectedMessageKey: TranslationKey,
    readonly actorRole: InterventionRole,
    requiredFlags?: SimFlag[],
    raisedFlags?: SimFlag[],
    availableToRoles?: InterventionRole[]
  ) {
    super(
      uid,
      title,
      description,
      duration,
      1, // an appointed role can only exist once, so this action cannot be repeated
      ActionType.ACTION,
      requiredFlags,
      raisedFlags,
      availableToRoles
    );
  }

  protected createActionFromEvent(event: FullEvent<AppointActorEvent>): AppointActorAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;
    return new AppointActorAction(
      payload.triggerTime,
      this.duration,
      event.id,
      this.title,
      ownerId,
      this.uid,
      this.raisedFlags,
      this.actorRole,
      this.hierarchyNotRespectedMessageKey
    );
  }

  public buildGlobalEvent(
    timeStamp: number,
    initiator: Readonly<Actor>,
    params: InterventionRole
  ): AppointActorEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      actorRole: params,
    };
  }

  // available if no such role is present
  // might change if multiple AL can be summoned
  // cannot be planned more than once at the same time
  protected override isAvailableCustom(
    state: Readonly<MainSimulationState>,
    actor: Readonly<Actor>
  ): boolean {
    return (
      state.getAllActors().every(act => act.Role !== this.actorRole) &&
      !ActionLogic.hasBeenPlannedByOtherActor(state, this.uid, actor.Uid)
    );
  }
}

/**
 * Book a moment for a situation update (point de situation)
 */
export interface CustomDurationPayload {
  duration: SimDuration;
}

export type CustomDurationActionTemplateType = CustomDurationActionTemplate<readonly number[]>;

/**
 * Custom duration actions.
 * The generic typing guarantees the defaultOption is contained in the durationOptions.
 */
export class CustomDurationActionTemplate<O extends readonly number[]> extends StartEndTemplate<
  CustomDurationAction,
  StandardActionEvent,
  CustomDurationPayload
> {
  private readonly durationOptions: O;
  private readonly defaultOption: O[number];
  private readonly selectOptions: { label: string; value: string }[];

  /**
   *
   * @param durationOptions The duration options we want to show to the player
   * @param defaultOption The value for the default selected option, must be in durationOptions
   */
  constructor(
    uid: ActionTemplateUid,
    title: TranslationKey,
    description: TranslationKey,
    durationOptions: O,
    defaultOption: O[number]
  ) {
    super(uid, title, description, 0, 0, ActionType.ACTION);

    this.durationOptions = durationOptions;
    this.defaultOption = defaultOption;

    this.selectOptions = this.durationOptions.map((nbMinutes: number) => {
      return {
        label: `${nbMinutes} ${getTranslation('mainSim-resources', 'minutes', false)}`,
        value: `${TimeSliceDuration * nbMinutes}`,
      };
    });
  }

  public getOptions() {
    return this.durationOptions;
  }

  public getdefaultOption() {
    return this.defaultOption;
  }

  public getSelectOptions() {
    return { all: this.selectOptions, default: TimeSliceDuration * this.defaultOption };
  }

  protected createActionFromEvent(event: FullEvent<StandardActionEvent>): CustomDurationAction {
    const payload = event.payload;
    const ownerId = payload.emitterCharacterId as ActorId;

    return new CustomDurationAction(
      payload.triggerTime,
      payload.durationSec,
      event.id,
      this.title,
      ownerId,
      this.uid
    );
  }

  public buildGlobalEvent(
    timeStamp: SimTime,
    initiator: Readonly<Actor>,
    params: CustomDurationPayload
  ): StandardActionEvent {
    return {
      ...this.initBaseEvent(timeStamp, initiator.Uid),
      durationSec: params.duration, // the duration is sent as a payload
    };
  }
}
