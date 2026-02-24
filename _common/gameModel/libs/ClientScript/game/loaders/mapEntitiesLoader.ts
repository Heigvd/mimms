import { parseObjectDescriptor } from '../../tools/WegasHelper';
import { getAvailableActionTemplateById, isChoiceTemplate } from '../../UIfacade/actionFacade';
import { ChoiceDescriptor } from '../common/actions/choiceDescriptor/choiceDescriptor';
import { ActionTemplateUid } from '../common/baseTypes';
import { Uid } from '../common/interfaces';
import { MapEntityDescriptor } from '../common/mapEntities/mapEntityDescriptor';
import { MapEntityActivable } from '../common/simulationState/activableState';
import { getCurrentState } from '../mainSimulationLogic';

/**
 * Load MapEntityDescriptors from WEGAS variable
 *
 * @returns Record<string, MapEntityDescriptor>
 */
function loadMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  return parseObjectDescriptor<MapEntityDescriptor>(Variable.find(gameModel, 'map_entity_data'));
}

let mapEntityDescriptors: Record<string, MapEntityDescriptor> | undefined = {};

Helpers.registerEffect(() => {
  // reset on script reload
  mapEntityDescriptors = undefined;
});

export function resetMapEntitiesCache(): void {
  mapEntityDescriptors = undefined;
}

/**
 * Get all MapEntityDescriptors mapped by their Uid
 *
 * @returns Record<string, MapEntityDescriptor>
 */
export function getMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  if (!mapEntityDescriptors) {
    mapEntityDescriptors = loadMapEntityDescriptors();
  }
  return mapEntityDescriptors;
}

/**
 * Get MapEntityDescriptor with given Uid
 *
 * @params Uid
 *
 * @returns MapEntityDescriptor | undefined
 */
export function getMapEntityDescriptor(uid: Uid): MapEntityDescriptor | undefined {
  return getMapEntityDescriptors()[uid];
}

/**
 * Get ChoiceDescriptor for given choiceUid of given templateUid
 *
 * @params number
 * @params Uid
 *
 * @returns ChoiceDescriptor | undefined
 */
export function getChoiceDescriptor(
  templateUid: ActionTemplateUid,
  choiceUid: Uid
): ChoiceDescriptor | undefined {
  const template = getAvailableActionTemplateById(templateUid);

  if (template && isChoiceTemplate(template)) {
    return template.choices.find(c => c.uid === choiceUid);
  }
}

/**
 * Get active MapEntityDescriptors mapped by their Uid
 *
 * @returns Record<string, MapEntityDescriptor>
 */
export function getActiveMapEntityDescriptors(): Record<string, MapEntityDescriptor> {
  const activeUids = getActiveMapActivables().map(ma => ma.uid);
  const meds = getMapEntityDescriptors();

  const filtered: Record<string, MapEntityDescriptor> = {};
  for (const uid of activeUids) {
    if (uid in meds && meds[uid]) {
      filtered[uid] = meds[uid]!;
    }
  }

  return filtered;
}

/**
 * Get all MapEntityActivables
 *
 * @returns MapEntityActivable[]
 */
function getMapActivables(): MapEntityActivable[] {
  const activables = getCurrentState().getInternalStateObject().activables;

  return Object.values(activables).filter(
    a => a.activableType === 'mapEntity'
  ) as MapEntityActivable[];
}

/**
 * Get MapEntityActivable with given Uid
 *
 * @params Uid
 *
 * @returns MapEntityActivable | undefined
 */
export function getMapActivableFromUid(uid: Uid): MapEntityActivable | undefined {
  return getMapActivables().find(ma => ma.uid === uid);
}

/**
 * Get active MapEntityActivables
 *
 * @returns MapEntityActivable[]
 */
function getActiveMapActivables(): MapEntityActivable[] {
  return getMapActivables().filter(a => a.active);
}
