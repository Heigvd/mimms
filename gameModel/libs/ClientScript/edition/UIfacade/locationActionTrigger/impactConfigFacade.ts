import { Impact } from '../../../game/common/impacts/impact';
import { ActivationImpact } from '../../../game/common/impacts/implementation/activationImpact';
import { Uid } from '../../../game/common/interfaces';
import { getTriggerController } from '../../controllers/controllerInstances';
import { TriggerFlatType } from '../../controllers/dataController';
import {
  FlatImpact,
  getImpactDefinition,
  toFlatImpact,
} from '../../typeDefinitions/impactDefinition';

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
export function getImpactDisplayTypeSelection(): { label: string; value: DisplayType }[] {
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

// TODO make 1 shared function for common stuff

// replace the impact by a new default one, but keep uid, parent and index
export function changeDisplayType(uid: FlatImpact['uid'], newDisplayType: DisplayType): void {
  const controller = getTriggerController(); // TODO generic
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone(); // TODO generic

  if (data[uid]?.superType !== 'impact') {
    throw new Error(`UID ${uid} does not match any impact`);
  }

  const newImpactType: FlatImpact['type'] = getNewImpactType(newDisplayType);

  const itemSaved: FlatImpact = data[uid] as FlatImpact;

  if (data[uid] != undefined) {
    delete data[uid];
  }

  const newImpact: FlatImpact = {
    ...toFlatImpact(getImpactDefinition(newImpactType).getDefault(), itemSaved.parent),
    ...{ uid: itemSaved.uid, index: itemSaved.index },
  };

  if (newImpact.type === 'activation') {
    newImpact.activableType = getNewActivableType(newDisplayType);
  }

  data[newImpact.uid] = newImpact;
  controller.updateData(data);
}

// replace the impact by a new default one, but keep uid, parent, index, target
export function changeImpactTypeForChoice(
  uid: FlatImpact['uid'],
  newImpactType: FlatImpact['type'] & ('effectSelection' | 'activation')
): void {
  const controller = getTriggerController(); // TODO generic
  const data: Record<Uid, TriggerFlatType> = controller.getFlatDataClone(); // TODO generic

  if (data[uid]?.superType !== 'impact') {
    throw new Error(`UID ${uid} does not match any impact`);
  }

  const itemSaved: FlatImpact = data[uid] as FlatImpact;

  if (data[uid] != undefined) {
    delete data[uid];
  }

  const newImpact: FlatImpact = {
    ...toFlatImpact(getImpactDefinition(newImpactType).getDefault(), itemSaved.parent),
    ...{ uid: itemSaved.uid, index: itemSaved.index },
  };

  if (newImpact.type === 'activation') {
    newImpact.activableType = 'choice';
  }

  if (
    (newImpact.type === 'effectSelection' ||
      (newImpact.type === 'activation' && newImpact.activableType === 'choice')) &&
    (itemSaved.type === 'effectSelection' ||
      (itemSaved.type === 'activation' && itemSaved.activableType === 'choice'))
  ) {
    newImpact.target = itemSaved.target;
  }

  data[newImpact.uid] = newImpact;
  controller.updateData(data);
}

// Given a display type, which type must be used to create a new impact
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
      throw new Error('Not handled dislay type ' + displayType);
  }
}

// Given a display type, which activableType must be used to create a new impact
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
      throw new Error('Not handled dislay type ' + displayType);
  }
}
