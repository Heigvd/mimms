import { doActionOnHumanBody } from '../../HUMAn/human';
import {
  ActDefinition,
  ActionBodyEffect,
  ActionBodyMeasure,
  HumanAction,
  ItemDefinition,
  RevivedPathology,
} from '../../HUMAn/pathology';
import { getAct, getItem } from '../../HUMAn/registries';
import {
  PRETRI_ACTION_ID_OPEN_AIRWAYS,
  PRETRI_ACTION_ID_RECOVERY_POSITION,
  PRETRI_ACTION_ITEM_ID_BANDAGE,
  PRETRI_ACTION_ITEM_ID_CAT,
} from '../../HUMAn/registry/acts';
import { getPathologyDefinitionById } from '../../HUMAn/registry/pathologies';
import { logger } from '../../tools/logger';
import { getActTranslation, getItemActionTranslation } from '../../tools/translation';
import { PreTriageData } from './triage';

function isActionBodyEffect(action: HumanAction | undefined): action is ActionBodyEffect {
  return action?.type === 'ActionBodyEffect';
}

function isMeasureAction(action: HumanAction | undefined): action is ActionBodyMeasure {
  return action?.type === 'ActionBodyMeasure';
}

export interface ResolvedAction {
  source: ActDefinition | ItemDefinition;
  label: string;
  actionId: string;
  action: ActionBodyEffect | ActionBodyMeasure;
}

function listHemorrhageActionItems(): string[] {
  return [PRETRI_ACTION_ITEM_ID_CAT, PRETRI_ACTION_ITEM_ID_BANDAGE];
}

function getBestHemorrhageItemAndAction(
  hemorrageZone: string,
): [string | undefined, string | undefined] {
  for (const actionItemString of listHemorrhageActionItems()) {
    const item = getItem(actionItemString);
    for (const actionKey of Object.keys(item?.actions!)) {
      for (const block of (item?.actions[actionKey] as ActionBodyEffect).blocks) {
        if (block === hemorrageZone) {
          return [item!.id, actionKey];
        }
      }
    }
  }
  return [undefined, undefined];
}

function resolveAction(
  actionType: string,
  actionId: string,
  itemId?: string,
): ResolvedAction | undefined {
  if (actionType === 'act') {
    const act = getAct(actionId);
    const action = act?.action;
    if (isActionBodyEffect(action) || isMeasureAction(action)) {
      const label = act ? getActTranslation(act) : `${actionId}`;
      return {
        source: { ...act!, type: 'act' },
        label: label,
        actionId: 'default',
        action: action,
      };
    }
  } else if (actionType === 'itemAction') {
    const item = getItem(itemId!);
    const action = item?.actions[actionId];
    if (isActionBodyEffect(action) || isMeasureAction(action)) {
      const label = item ? getItemActionTranslation(item, actionId) : `${itemId}::${actionId}`;
      return {
        source: { ...item!, type: 'item' },
        actionId: actionId,
        label: label,
        action: action,
      };
    }
  }

  return undefined;
}

function getPathologyTypesById(id: string): string[] {
  return getPathologyDefinitionById(id).modules.map(defModule => defModule.type);
}

function getHemorrhageZone(pathology: RevivedPathology): string[] {
  if (
    getPathologyTypesById(pathology.pathologyId).find(
      pathologyType => pathologyType === 'Hemorrhage',
    ) !== undefined
  ) {
    return pathology.modules.map(pathologyModule => pathologyModule.block);
  }
  return [];
}

export function healHemorrhages(
  data: PreTriageData,
  applyPretriageActions: boolean = false,
  simTime: number = 0,
) {
  if (!applyPretriageActions) data.actions.push('Try to stop massive hemorrhage');
  else {
    let hemorrhageZones: string[] = [];
    // get hemorrhage zones from patient
    hemorrhageZones = data.health.pathologies.flatMap(pathology => getHemorrhageZone(pathology));
    hemorrhageZones.forEach(hemorrhageZone => {
      let [bestItemId, bestActionId] = getBestHemorrhageItemAndAction(hemorrhageZone);
      if (bestActionId && bestItemId) {
        const { source, actionId, action, label }: ResolvedAction = resolveAction(
          'itemAction',
          bestActionId,
          bestItemId,
        )!;
        if (action != null) {
          if (action.type === 'ActionBodyEffect') {
            logger.debug('Apply: ', { time: simTime, bestItemId, hemorrhageZone });
            const bodyEffect = doActionOnHumanBody(
              source,
              action,
              actionId,
              [hemorrhageZone],
              simTime,
            );
            if (bodyEffect) data.health.effects.push(bodyEffect);
          }
        }
      }
    });
  }
}

export function clearAirways(
  data: PreTriageData,
  applyPretriageActions: boolean = false,
  simTime: number = 0,
) {
  if (!applyPretriageActions) data.actions.push('LVAS');
  else executeAction(data, PRETRI_ACTION_ID_OPEN_AIRWAYS, simTime);
}

export function placeInRecoveryPosition(
  data: PreTriageData,
  applyPretriageActions: boolean = false,
  simTime: number = 0,
) {
  if (!applyPretriageActions) data.actions.push('RecoveryPosition');
  else executeAction(data, PRETRI_ACTION_ID_RECOVERY_POSITION, simTime);
}

function executeAction(data: PreTriageData, actionIdentifier: string, simTime: number) {
  const { source, actionId, action, label }: ResolvedAction = resolveAction(
    'act',
    actionIdentifier,
  )!;
  if (action != null) {
    if (action.type === 'ActionBodyEffect') {
      logger.debug('ACTION: ', { time: simTime, source, action });
      const bodyEffect = doActionOnHumanBody(source, action, actionId, [], simTime);
      if (bodyEffect) data.health.effects.push(bodyEffect);
    }
  }
}
