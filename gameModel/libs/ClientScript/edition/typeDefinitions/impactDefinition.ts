import { Impact } from '../../game/common/impacts/impact';
import { MapToDefinition, MapToTypeNames } from '../typeDefinitions/definition';

type ImpactTypeName = MapToTypeNames<Impact>;
export type ImpactDefinition = MapToDefinition<Impact>;

export function getImpactDefinition(type: ImpactTypeName): ImpactDefinition {
  // TODO should not be partial and give all definitions
  const defs: Partial<Record<ImpactTypeName, ImpactDefinition>> = {};

  return defs[type]!;
}
