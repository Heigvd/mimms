/***
 * Read queries on activable descriptor objects
 */

import { isActivableDescriptor, Uid } from '../../game/common/interfaces';
import { entries } from '../../tools/helper';
import { FlatActivable } from '../controllers/dataController';
import { getFlatObjects } from '../UIfacade/genericConfigFacade';

type ActivableTypeNames = FlatActivable['activableType'];

// It seems that it is deprecated as we don't have any common activable display for the user anymore

// TODO more filtering might be needed if some elements are non impactable by scenarist

export function getActivableOfType(type: ActivableTypeNames | 'all'): Record<Uid, FlatActivable> {
  const result: Record<Uid, FlatActivable> = {};
  entries(getFlatObjects()).forEach(([id, obj]) => {
    if (isActivableDescriptor(obj) && (type === obj.activableType || type === 'all')) {
      result[id] = obj;
    }
  });

  return result;
}
