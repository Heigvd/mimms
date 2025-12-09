import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import { Impact } from '../../game/common/impacts/impact';
import { ActivationImpact } from '../../game/common/impacts/implementation/activationImpact';
import { Uid } from '../../game/common/interfaces';
import { getTriggerController } from '../controllers/controllerInstances';
import { ActionTemplateDataController, TriggerDataController } from '../controllers/dataController';
import { FlatImpact, getImpactDefinition, toFlatImpact } from '../typeDefinitions/impactDefinition';
import {
  ALL_CHOICES_OPTION_VALUE,
  AllChoiceOptionType,
  allChoicesOption,
  getChoicesOptions,
  getDefaultEffect,
  getMatchingActionTemplateUid,
} from './dataFetcher';

export function getController(): TriggerDataController | ActionTemplateDataController {
  // TODO either trigger controller or action template controller
  return getTriggerController();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Display types

export type DisplayType =
  | 'empty'
  | 'radio'
  | 'notification'
  | 'actionTemplate'
  | 'mapEntity'
  | 'trigger';

// Directly used in pages
export function getImpactDisplayTypeOptions(): { label: string; value: DisplayType }[] {
  return [
    {
      label: 'radio message',
      value: 'radio',
    },
    {
      label: 'notification',
      value: 'notification',
    },
    {
      label: 'location',
      value: 'mapEntity',
    },
    {
      label: 'trigger',
      value: 'trigger',
    },
    {
      label: 'action',
      value: 'actionTemplate',
    },
  ];
}

// Given an impact, compute which display type must be used
// Directly used in pages
export function inferDisplayType(impact: FlatImpact): DisplayType {
  const type = impact.type;
  switch (type) {
    case 'empty':
      return 'empty';
    case 'radio':
      return 'radio';
    case 'notification':
      return 'notification';
    case 'activation':
      switch (impact.activableType) {
        case 'mapEntity':
          return 'mapEntity';
        case 'trigger':
          return 'trigger';
        case 'actionTemplate':
        case 'choice':
        default:
          return 'actionTemplate';
      }
    case 'mapActivation':
      return 'mapEntity';
    case 'effectSelection':
      return 'actionTemplate';
    default:
      throw new Error('Not handled impact type ' + type);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// impact initialisation

// replace the impact by a new default one regarding the given newDisplayType
// keep parent, uid and index
export function changeDisplayType(impact: FlatImpact, newDisplayType: DisplayType): void {
  const newImpactType: FlatImpact['type'] = getNewImpactType(newDisplayType);

  const newImpact: FlatImpact = createSubstitutionImpact(newImpactType, impact);

  if (newImpact.type === 'activation') {
    newImpact.activableType = getNewActivableType(newDisplayType);
  }

  getController().updateItem(newImpact);
}

// replace the impact by a new default one, but keep uid, parent, index, target
function createSubstitutionImpact(newType: FlatImpact['type'], baseImpact: FlatImpact): FlatImpact {
  const newItem: FlatImpact = toFlatImpact(
    getImpactDefinition(newType).getDefault(),
    baseImpact.parent
  );
  newItem.uid = baseImpact.uid;
  newItem.index = baseImpact.index;
  return newItem;
}

// Given a display type, define which type must be used to create a new impact
function getNewImpactType(displayType: DisplayType): Impact['type'] {
  switch (displayType) {
    case 'empty':
      return 'empty';
    case 'radio':
      return 'radio';
    case 'notification':
      return 'notification';
    case 'actionTemplate':
      return 'activation';
    case 'mapEntity':
      return 'mapActivation';
    case 'trigger':
      return 'activation';
    default:
      throw new Error('Not handled display type ' + displayType);
  }
}

// Given a display type, define which activableType must be used to create a new impact
function getNewActivableType(displayType: DisplayType): ActivationImpact['activableType'] {
  switch (displayType) {
    case 'actionTemplate':
      return 'actionTemplate';
    case 'mapEntity':
      return 'mapEntity';
    case 'trigger':
      return 'trigger';
    case 'empty':
    case 'radio':
    case 'notification':
    default:
      throw new Error('Not handled display type ' + displayType);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// action and choice specificities

export function getImpactActionUid(impact: FlatImpact): Uid | undefined {
  if (impact.type === 'activation') {
    if (impact.activableType === 'actionTemplate') {
      return impact.target;
    }

    if (impact.activableType === 'choice' && impact.target) {
      return getMatchingActionTemplateUid(impact.target);
    }
  } else if (impact.type === 'effectSelection' && impact.target) {
    return getMatchingActionTemplateUid(impact.target);
  }

  return undefined;
}

export function getImpactChoiceUid(impact: FlatImpact): Uid | typeof ALL_CHOICES_OPTION_VALUE {
  if (
    impact.type === 'effectSelection' ||
    (impact.type === 'activation' && impact.activableType === 'choice')
  ) {
    return impact.target;
  }

  return ALL_CHOICES_OPTION_VALUE;
}

export function getImpactEffectUid(impact: FlatImpact): Uid | undefined {
  if (impact.type === 'effectSelection') {
    return impact.targetEffect;
  }

  return undefined;
}

export function getEffectiveImpactChoicesOptions(
  impact: FlatImpact
): ({ label: string; value: ChoiceDescriptor['uid'] } | AllChoiceOptionType)[] {
  const actionTemplateUid: Uid | undefined = getImpactActionUid(impact);

  if (actionTemplateUid) {
    return [allChoicesOption, ...getChoicesOptions(actionTemplateUid)];
  }

  return [allChoicesOption];
}

export function isEffectSelectionMode(impact: FlatImpact): boolean {
  return impact.type === 'effectSelection';
}

export function canEnterEffectSelectionMode(impact: FlatImpact): boolean {
  return (
    impact.type === 'effectSelection' ||
    (impact.type === 'activation' && impact.activableType === 'choice')
  );
}

export function canEnterShowOnMap(impact: FlatImpact): boolean {
  return impact.type === 'mapActivation' && impact.target.length > 0;
}

export function setActivationImpactOption(
  impact: FlatImpact,
  newOption: ActivationImpact['option']
): void {
  if (impact.type === 'activation' && impact.option === newOption) {
    // no change => nothing to do
    return;
  }

  let newImpact: FlatImpact = { ...impact };

  // in case it was a choice effect selection impact
  if (newImpact.type !== 'activation') {
    newImpact = changeChoiceImpactType(impact, 'activation');
  }

  // cannot happen ... but you know ... make it compile ...
  if (newImpact.type !== 'activation') {
    throw new Error('must be an activation impact');
  }

  newImpact.option = newOption;

  getController().updateItem(newImpact);
}

export function setChoiceEffectSelectionType(impact: FlatImpact): void {
  const newImpact = changeChoiceImpactType(impact, 'effectSelection');
  getController().updateItem(newImpact);
}

// change between choice activation and choice effect selection
function changeChoiceImpactType(
  impact: FlatImpact,
  newImpactType: FlatImpact['type'] & ('effectSelection' | 'activation')
): FlatImpact {
  // assert that it is a change between choice activation and choice effect selection
  if (
    !(
      (impact.type === 'effectSelection' && newImpactType === 'activation') ||
      (impact.type === 'activation' &&
        impact.activableType === 'choice' &&
        newImpactType === 'effectSelection')
    )
  ) {
    throw new Error('switch choice impact type base use case');
  }

  if (impact.type === newImpactType) {
    // no change => nothing to do
    return impact;
  }

  const newImpact: FlatImpact = createSubstitutionImpact(newImpactType, impact);

  if (newImpact.type === 'activation') {
    newImpact.activableType = 'choice';
  }

  if (
    newImpact.type === 'effectSelection' ||
    (newImpact.type === 'activation' && newImpact.activableType === 'choice')
  ) {
    newImpact.target = impact.target;
  }

  if (newImpact.type === 'effectSelection') {
    newImpact.targetEffect = getDefaultEffect(newImpact.target);
  }

  return newImpact;
}

export function updateImpactActionRef(impact: FlatImpact, actionRef: string): void {
  if (
    impact.type === 'activation' &&
    impact.activableType === 'actionTemplate' &&
    getImpactActionUid(impact) === actionRef
  ) {
    // no change => nothing to do
    return;
  }

  let newImpact: FlatImpact = { ...impact };

  // in case it was a choice effect selection impact, change it to be an activation
  if (impact.type !== 'activation') {
    newImpact = changeChoiceImpactType(impact, 'activation');
  }

  // cannot happen ... but you know ... make it compile ...
  if (newImpact.type !== 'activation') {
    throw new Error('must be an activation impact');
  }

  // make it be an action template activation
  newImpact.activableType = 'actionTemplate';

  newImpact.target = actionRef;

  getController().updateItem(newImpact);
}

export function updateImpactChoiceRef(
  impact: FlatImpact,
  newChoiceRef: Uid | typeof ALL_CHOICES_OPTION_VALUE
): void {
  if (getImpactChoiceUid(impact) === newChoiceRef) {
    // no change => nothing to do
    return;
  }

  if (newChoiceRef === ALL_CHOICES_OPTION_VALUE) {
    // if it is "any choice", make it be an action template activation
    const previousChoiceRef = getImpactChoiceUid(impact);
    if (previousChoiceRef && previousChoiceRef !== ALL_CHOICES_OPTION_VALUE) {
      const newActionRef = getMatchingActionTemplateUid(previousChoiceRef);
      updateImpactActionRef(impact, newActionRef);
    }
  } else {
    const newImpact: FlatImpact = { ...impact };

    if (newImpact.type === 'activation') {
      newImpact.activableType = 'choice';
      newImpact.target = newChoiceRef;
    } else if (newImpact.type === 'effectSelection') {
      newImpact.target = newChoiceRef;
      newImpact.targetEffect = getDefaultEffect(newChoiceRef);
    }

    getController().updateItem(newImpact);
  }
}
