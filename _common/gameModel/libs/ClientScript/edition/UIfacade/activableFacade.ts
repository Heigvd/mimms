/***
 * Read queries on activable descriptor objects
 */

import { IActivableDescriptor, Uid } from '../../game/common/interfaces';
import { entries } from '../../tools/helper';
import { FlatActivable } from '../controllers/dataControllerBase';
import { getFlatObjects } from '../UIfacade/genericConfigFacade';

type ActivableTypeNames = FlatActivable['activableType'];

// It seems that it is deprecated as we don't have any common activable display for the user anymore
// XGO : Keep, we might need that to check for impact / condition targets
// TODO more filtering might be needed if some elements are non impactable by scenarist

export function getActivableOfType(
  type: ActivableTypeNames | 'all'
): Readonly<Record<Uid, Readonly<FlatActivable>>> {
  const result: Record<Uid, FlatActivable> = {};
  entries(getFlatObjects()).forEach(([id, obj]) => {
    if (isActivableDescriptor(obj) && (type === obj.activableType || type === 'all')) {
      result[id] = obj;
    }
  });

  return result;
}

function isActivableDescriptor(obj: any): obj is IActivableDescriptor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.activableType === 'string' &&
    typeof obj.activeAtStart === 'boolean' &&
    typeof obj.tag === 'string'
  );
}
