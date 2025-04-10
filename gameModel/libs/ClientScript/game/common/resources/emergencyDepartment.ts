import { entries } from '../../../tools/helper';
import { getTranslation } from '../../../tools/translation';
import { getCasuActorId } from '../actors/actorLogic';
import { ActorId, GlobalEventId, ResourceContainerDefinitionId } from '../baseTypes';
import {
  AddRadioMessageLocalEvent,
  ResourceMobilizationEvent,
} from '../localEvents/localEventBase';
import { getLocalEventManager } from '../localEvents/localEventManager';
import { RadioType } from '../radio/communicationType';
import { getContainersDefinitions } from '../simulationState/loaders/resourceLoader';
import { MainSimulationState } from '../simulationState/mainSimulationState';
import {
  ResourceContainerConfig,
  ResourceContainerDefinition,
  ResourceContainerType,
} from './resourceContainer';

export function getContainerDef(id: ResourceContainerDefinitionId): ResourceContainerDefinition {
  return getContainersDefinitions()[id]!;
}

export function hasContainerOfType(
  state: Readonly<MainSimulationState>,
  type: ResourceContainerType
): boolean {
  const config = state.getResourceContainersByType()[type];
  return config?.some(c => c.amount > 0);
}

/**
 * This method changes the state, it should only be called during a state update
 * Resolve a resource request made by a player
 * fetch all the resources available and dispatch them
 * if the resource is not available right away it will be sent later but scheduled
 * @param state the current state of the game
 * @param globalEventId the global event id that triggered this request
 * @param senderId the author of the request
 * @param request the amount and type formulated in the request
 */
export function resolveResourceRequest(
  state: MainSimulationState,
  globalEventId: GlobalEventId,
  senderId: ActorId | undefined,
  request: Record<ResourceContainerType, number>
) {
  const containers = state.getResourceContainersByType();
  const now = state.getSimTime();

  const sentContainers: Record<
    number,
    { name: string; def: ResourceContainerDefinition; travelTime: number }[]
  > = {};

  function addDepartureEntry(
    departureTime: number,
    travelTime: number,
    containerName: string,
    containerDef: ResourceContainerDefinition
  ) {
    if (!sentContainers[departureTime]) {
      sentContainers[departureTime] = [];
    }
    sentContainers[departureTime]?.push({
      name: containerName,
      def: containerDef,
      travelTime: travelTime,
    });
  }

  entries(request)
    .filter(([_typeId, requestedAmount]) => requestedAmount > 0)
    .forEach(([typeId, requestedAmount]) => {
      // fetch the containers that still have an amount
      const cs: ResourceContainerConfig[] = (containers[typeId] || []).filter(c => c.amount > 0);
      // ordered by time of availability
      cs.sort((a, b) => a.availabilityTime - b.availabilityTime);
      let foundAmount = 0;
      for (let i = 0; i < cs.length && foundAmount < requestedAmount; i++) {
        const c = cs[i]!;
        const n = Math.min(requestedAmount - foundAmount, c.amount);
        // n > 0 by construction
        foundAmount += n;
        c.amount -= n; // !!! STATE CHANGE HERE !!!

        const departureTime = Math.max(c.availabilityTime, now);
        const definition = getContainerDef(c.templateId);
        const evt = new ResourceMobilizationEvent(
          globalEventId,
          now,
          departureTime,
          c.travelTime,
          definition.uid,
          n,
          c.name
        );
        getLocalEventManager().queueLocalEvent(evt);
        addDepartureEntry(departureTime, c.travelTime, c.name, definition);
      }
    });
  queueResourceDepartureRadioMessageEvents(sentContainers, globalEventId, senderId);
}

/**
 * Generates one radio message per departure time containing all the sent ressources at that time
 * @param sentContainers
 * @param globalEventId
 * @param senderId
 */
function queueResourceDepartureRadioMessageEvents(
  sentContainers: Record<
    number,
    { name: string; def: ResourceContainerDefinition; travelTime: number }[]
  >,
  globalEventId: GlobalEventId,
  senderId: ActorId | undefined
): void {
  Object.entries(sentContainers).forEach(([depTime, sent]) => {
    const dtime = parseInt(depTime);
    const msgs: string[] = [];

    Object.values(sent).forEach(v => {
      msgs.push(buildRadioText(v.travelTime, v.def, v.name));
    });

    const evt = new AddRadioMessageLocalEvent(
      globalEventId,
      dtime,
      getCasuActorId(),
      undefined,
      senderId,
      msgs.join('\n'),
      RadioType.CASU,
      true
    );
    getLocalEventManager().queueLocalEvent(evt);
  });
}

function buildRadioText(travelTime: number, c: ResourceContainerDefinition, name: string): string {
  const parts: string[] = [];
  parts.push(getTranslation('mainSim-resources', 'sending'));
  parts.push(name); // Specific name (e.g. AMB002)
  parts.push('(' + getTranslation('mainSim-resources', c.name) + ')'); // type
  parts.push(getTranslation('mainSim-resources', 'arrival-in', false));
  parts.push(Math.round(travelTime / 60) + '');
  parts.push(getTranslation('mainSim-resources', 'minutes', false));
  return parts.join(' ');
}
