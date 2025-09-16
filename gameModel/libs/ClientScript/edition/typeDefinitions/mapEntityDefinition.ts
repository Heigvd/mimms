import { MapEntityDescriptor } from '../../game/common/mapEntities/mapEntityDescriptor';
import { MapToFlatType } from '../typeDefinitions/definition';

export type FlatMapEntity = MapToFlatType<MapEntityDescriptor, 'mapEntity'>;

// XGO TODO from/toFlat functions (see other files)
// XGO TODO definition
