/**
 * Builds activable state objects for
 * Triggers
 * ActionTemplates
 * Choices
 */

import { TemplateDescriptor } from '../common/actions/actionTemplateDescriptor/templateDescriptor';
import { Uid } from '../common/interfaces';
import { Activable, fromDescriptor } from '../common/simulationState/activableState';
import { Trigger } from '../common/triggers/trigger';

export function buildActivables(): Record<Uid, Activable> {
  const activables: Record<Uid, Activable> = {};

  addTriggerActivables(activables);
  addActionsAndChoicesActivables(activables);
  addMapEntitiesActivables(activables);
  return activables;
}

function addTriggerActivables(activables: Record<Uid, Activable>): void {
  // TODO triggers from WEGAS variable
  const triggers: Record<Uid, Trigger> = {};

  Object.values(triggers).forEach((t: Trigger) => {
    activables[t.uid] = fromDescriptor(t);
  });
}

function addActionsAndChoicesActivables(activables: Record<Uid, Activable>): void {
  // TODO action templates from WEGAS variable
  const tpls: Record<Uid, TemplateDescriptor> = {};

  Object.values(tpls).forEach((t: TemplateDescriptor) => {
    activables[t.uid] = fromDescriptor(t);
    t.choices?.forEach(choice => (activables[choice.uid] = fromDescriptor(choice)));
  });
}

function addMapEntitiesActivables(_activables: Record<Uid, Activable>): void {
  // TODO
}
