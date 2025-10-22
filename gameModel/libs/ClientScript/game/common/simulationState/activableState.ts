import { TemplateDescriptor } from '../actions/actionTemplateDescriptor/templateDescriptor';
import { ChoiceDescriptor } from '../actions/choiceDescriptor/choiceDescriptor';
import { IActivableDescriptor, Uid } from '../interfaces';
import { BuildStatus, MapEntityDescriptor } from '../mapEntities/mapEntityDescriptor';
import { Trigger } from '../triggers/trigger';

/**
 * Expresses the state of all runtime activable/deactivable objects
 * ActionTemplates
 * Choices
 * Triggers
 * MapLocations TODO
 */

interface ActivableState<T extends IActivableDescriptor> {
  activableType: T['activableType'];
  active: boolean;
  uid: Uid;
}

export interface ActionTemplateActivable extends ActivableState<TemplateDescriptor> {
  count: number;
}

export interface TriggerActivable extends ActivableState<Trigger> {
  count: number;
}

export interface ChoiceActivable extends ActivableState<ChoiceDescriptor> {
  count: number;
  selectedEffect: Uid;
}

export interface MapEntityActivable extends ActivableState<MapEntityDescriptor> {
  buildStatus: BuildStatus;
}

// TODO map entities objects, there might be a sub state such as 'building' as in current implementation

type DescriptorActivableType =
  | TemplateDescriptor
  | ChoiceDescriptor
  | Trigger
  | MapEntityDescriptor;

export type Activable =
  | ActionTemplateActivable
  | TriggerActivable
  | ChoiceActivable
  | MapEntityActivable;

export function fromDescriptor<DType extends DescriptorActivableType>(
  descriptor: DType
): Activable {
  switch (descriptor.activableType) {
    case 'actionTemplate':
      const ata: ActionTemplateActivable = {
        uid: descriptor.uid,
        activableType: descriptor.activableType,
        active: descriptor.activeAtStart,
        count: 0,
      };
      return ata;
    case 'choice':
      const ca: ChoiceActivable = {
        uid: descriptor.uid,
        activableType: descriptor.activableType,
        active: descriptor.activeAtStart,
        count: 0,
        selectedEffect: descriptor.defaultEffect,
      };
      return ca;
    case 'trigger':
      const ta: TriggerActivable = {
        uid: descriptor.uid,
        activableType: descriptor.activableType,
        active: descriptor.activeAtStart,
        count: 0,
      };
      return ta;
    case 'mapEntity':
      const mae: MapEntityActivable = {
        uid: descriptor.uid,
        activableType: descriptor.activableType,
        active: descriptor.activeAtStart,
        buildStatus: descriptor.buildStatus,
      };
      return mae;
  }
}
