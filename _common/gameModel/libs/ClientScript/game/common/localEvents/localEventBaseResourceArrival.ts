import {
  ActorId,
  GlobalEventId,
  ResourceContainerDefinitionId,
  SimDuration,
  SimTime,
} from '../baseTypes';
import { CasuMessagePayload, MethaneMessagePayload } from '../events/casuMessageEvent';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import { getContainerDef, resolveResourceRequest } from '../resources/emergencyDepartment';
import { AddActorLocalEvent } from './localEventActors';
import { getLocalEventManager } from './localEventManager';
import { ResourceType } from '../resources/resourceType';
import {
  AddMessageLocalEvent,
  AddNotificationLocalEvent,
  AddRadioMessageLocalEvent,
} from './localEventRadio';
import * as RadioLogic from '../radio/radioLogic';
import * as ResourceLogic from '../resources/resourceLogic';
import { resourceArrivalLocationResolution } from '../resources/resourceLogic';
import { resourceLogger } from '../../../tools/logger';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { entries, keys } from '../../../tools/helper';
import * as ResourceState from '../simulationState/resourceStateAccess';
import { getHighestAuthorityActorsByLocation } from '../actors/actorLogic';
import { FailedRessourceArrivalDelay } from '../constants';
import { ResourceContainerType } from '../resources/resourceContainer';
import { getTranslation } from '../../../tools/translation';
import { RadioType } from '../radio/communicationType';
import { LocalEventBase, SourceType } from './localEventBase';

/**
 * Takes a player formulated request and resolves it given
 * the emergency center's available resources
 */
export class ResourceRequestResolutionLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly actorUid: ActorId | undefined;
      readonly request: CasuMessagePayload;
    }
  ) {
    super({ ...props, type: 'ResourceRequestResolutionLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    // check that the payload subtypes to MethaneMessagePayload
    if (this.props.request.messageType !== 'R' && this.props.request.resourceRequest) {
      resolveResourceRequest(
        state,
        this.props.parentEventId,
        this.props.source,
        this.props.actorUid,
        this.props.request.resourceRequest
      );
    }
  }
}

export class AutoSendACSMCSLocalEvent extends ResourceRequestResolutionLocalEvent {
  constructor(
    readonly extensionProps: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
    }
  ) {
    //Request ACS-MCS
    const casuMessage: MethaneMessagePayload = {
      messageType: 'E',
      resourceRequest: {
        'ACS-MCS': 1,
        Ambulance: 0,
        SMUR: 0,
        PMA: 0,
        DPMA: 0,
        'PC-San': 0,
        Helicopter: 0,
      },
    };
    super({ ...extensionProps, actorUid: undefined, request: casuMessage });
  }

  override applyStateUpdate(state: MainSimulationState): void {
    resourceLogger.info('Force requesting ACS-MCS if needed');
    super.applyStateUpdate(state);
  }
}

/**
 * Spawned when the emergency dept sends resource containers
 */
export class ResourceMobilizationLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly departureTime: SimTime;
      readonly travelTime: SimDuration;
      readonly containerDefId: ResourceContainerDefinitionId;
      readonly amount: number;
      readonly configName: string;
    }
  ) {
    super({ ...props, type: 'ResourceMobilizationLocalEvent' });
  }

  override applyStateUpdate(_state: MainSimulationState): void {
    const containerDef = getContainerDef(this.props.containerDefId);
    // We assume that containers are well configured
    // and thus that there are no duplicates

    // actors are created right away (they need to appear in the timeline)
    // Note : Actor creation ignores the "amount" value
    containerDef.roles.forEach(role => {
      const evt = new AddActorLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: this.props.departureTime,
        role,
        travelTime: this.props.travelTime,
      });
      getLocalEventManager().queueLocalEvent(evt);
    });

    if (
      Object.keys(containerDef.resources).length > 0 ||
      Object.keys(containerDef.flags).length > 0
    ) {
      // schedule resource arrival event
      const evt = new ResourcesArrivalLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: this.props.departureTime + this.props.travelTime,
        containerDefId: this.props.containerDefId,
        amount: this.props.amount,
        squadName: this.props.configName,
      });
      getLocalEventManager().queueLocalEvent(evt);
    }
  }
}

/**
 * Resources arrival on site
 * Resources are assigned to the highest hierarchy level present by default
 */
export class ResourcesArrivalLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly containerDefId: ResourceContainerDefinitionId;
      readonly amount: number;
      readonly squadName: string;
    }
  ) {
    super({ ...props, type: 'ResourcesArrivalLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    const containerDef = getContainerDef(this.props.containerDefId);

    if (ResourceLogic.resourceContainerCanArrive(state, containerDef.type)) {
      // add flags to state if any
      if (containerDef.flags) {
        containerDef.flags.forEach(f => (state.getInternalStateObject().flags[f] = true));
      }

      if (containerDef.resources) {
        const sentResourcesByLocations: Partial<
          Record<LOCATION_ENUM, Partial<Record<ResourceType, number>>>
        > = {};

        entries(containerDef.resources)
          .filter(([_resourceType, qty]) => qty && qty > 0)
          .forEach(([resourceType, qty]) => {
            const resourcesAmount = qty! * this.props.amount;
            const location: LOCATION_ENUM = resourceArrivalLocationResolution(state, resourceType);

            if (!sentResourcesByLocations[location]) {
              sentResourcesByLocations[location] = {};
            }
            sentResourcesByLocations[location]![resourceType] = resourcesAmount;

            ResourceState.addIncomingResources(state, resourceType, resourcesAmount, location);
          });

        keys(sentResourcesByLocations).forEach((location: LOCATION_ENUM) => {
          const greetingActors = getHighestAuthorityActorsByLocation(state, location);

          greetingActors.forEach((actorId: ActorId) => {
            getLocalEventManager().queueLocalEvent(
              new ResourceArrivalAnnouncementLocalEvent({
                parentEventId: this.props.parentEventId,
                source: this.props.source,
                simTimeStamp: this.props.simTimeStamp,
                recipientActor: actorId,
                resources: sentResourcesByLocations[location]!,
              })
            );
          });
        });
      }
    } else {
      // missing ambulance or helicopter park location
      // radio message to the user
      getLocalEventManager().queueLocalEvent(
        this.buildArrivalFailureRadioEvent(containerDef.type, state)
      );
      // TODO later : we might want to make the ressources arrive as soon as the park is defined
      // TODO if more than one container of a given type fails, do we want to aggregate the warning messages?
      // try again X minutes later
      getLocalEventManager().queueLocalEvent(
        new ResourcesArrivalLocalEvent({
          parentEventId: this.props.parentEventId,
          source: this.props.source,
          simTimeStamp: this.props.simTimeStamp + FailedRessourceArrivalDelay,
          containerDefId: this.props.containerDefId,
          amount: this.props.amount,
          squadName: this.props.squadName,
        })
      );
    }
  }

  private buildArrivalFailureRadioEvent(
    rtype: ResourceContainerType,
    state: MainSimulationState
  ): AddMessageLocalEvent {
    let parkKey = '';
    if (rtype === 'Ambulance') parkKey = 'location-ambulancePark';
    else if (rtype === 'Helicopter') parkKey = 'location-helicopterPark';
    else
      resourceLogger.warn('The ressources that are unable to arrive are ambulance and helicopter');
    const park = getTranslation('mainSim-locations', parkKey, false);
    const message = getTranslation('mainSim-locations', 'missingLocation', true, [
      park,
      this.props.squadName,
    ]);
    return new AddRadioMessageLocalEvent({
      parentEventId: this.props.parentEventId,
      source: this.props.source,
      simTimeStamp: state.getSimTime(),
      senderName: this.props.squadName,
      message,
      channel: RadioType.CASU,
      omitTranslation: true,
    });
  }
}

export class ResourceArrivalAnnouncementLocalEvent extends LocalEventBase {
  constructor(
    readonly props: {
      readonly parentEventId: GlobalEventId;
      readonly source: SourceType;
      readonly simTimeStamp: SimTime;
      readonly recipientActor: ActorId;
      readonly resources: Partial<Record<ResourceType, number>>;
    }
  ) {
    super({ ...props, type: 'ResourceArrivalAnnouncementLocalEvent' });
  }

  applyStateUpdate(state: MainSimulationState): void {
    getLocalEventManager().queueLocalEvent(
      new AddNotificationLocalEvent({
        parentEventId: this.props.parentEventId,
        source: this.props.source,
        simTimeStamp: state.getSimTime(),
        senderName: RadioLogic.getResourceAsSenderName(),
        recipientId: this.props.recipientActor,
        message: 'incoming-resources',
        messageValues: [
          ResourceLogic.formatResourceTypesAndNumber(this.props.resources).join(',<br/>'),
        ],
      })
    );
  }
}
