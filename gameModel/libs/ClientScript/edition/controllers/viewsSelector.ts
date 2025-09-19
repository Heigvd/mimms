import { getChoiceDefinition } from '../typeDefinitions/choiceDefinition';
import {
  getActionConditionDef,
  getChoiceConditionDef,
  getEmptyConditionDef,
  getMapEntityConditionDef,
  getTimeConditionDef,
  getTriggerConditionDef,
} from '../typeDefinitions/conditionDefinition';
import {
  ConfigurationView,
  EditionLevel,
  ToConfigurationViewType,
} from '../typeDefinitions/definition';
import {
  getActivationImpactDef,
  getChoiceEffectSelectionImpactDef,
  getEmptyImpactDef,
  getNotificationImpactDef,
  getRadioImpactDef,
} from '../typeDefinitions/impactDefinition';
import { getFixedMapEntityTemplate } from '../typeDefinitions/templateDefinitions/fixedMapEntityTemplate';
import { getFullyConfigurableTemplateDef } from '../typeDefinitions/templateDefinitions/fullyConfigurableTemplate';
import { getMoveTemplateDef } from '../typeDefinitions/templateDefinitions/moveTemplate';
import { getTriggerDefinition } from '../typeDefinitions/triggerDefinition';
import { FlatTypes, SuperTypeNames } from './dataController';

/**
 * Removes the superType and parent fields
 * (which are not needed for field visibility)
 */
type StripFlatTypeFields<T> = Omit<T, 'superType' | 'parent'>;

type Views = {
  /** Narrow key to super types (example : trigger, impact, ...) */
  [S in SuperTypeNames]: {
    /** In a given super type narrow to types (example : notification, radio, activation) */
    [T in Extract<
      FlatTypes,
      { superType: S }
    >['type']]: /** Map type to the configuration view type*/
    StripFlatTypeFields<ToConfigurationViewType<Extract<FlatTypes, { superType: S; type: T }>>>;
  };
};

const viewTree: Views = {
  action: {
    FixedMapEntityTemplateDescriptor: getFixedMapEntityTemplate().view,
    FullyConfigurableTemplateDescriptor: getFullyConfigurableTemplateDef().view,
    MoveActorTemplateDescriptor: getMoveTemplateDef().view,
  },
  trigger: {
    trigger: getTriggerDefinition().view,
  },
  choice: {
    choice: getChoiceDefinition().view,
  },
  impact: {
    activation: getActivationImpactDef().view,
    effectSelection: getChoiceEffectSelectionImpactDef().view,
    notification: getNotificationImpactDef().view,
    radio: getRadioImpactDef().view,
    empty: getEmptyImpactDef().view,
  },
  condition: {
    mapEntity: getMapEntityConditionDef().view,
    trigger: getTriggerConditionDef().view,
    choice: getChoiceConditionDef().view,
    action: getActionConditionDef().view,
    time: getTimeConditionDef().view,
    empty: getEmptyConditionDef().view,
  },
  effect: {
    effect: {} as any, //TODO
  },
  geometry: {
    Point: {} as any, // TODO
    Line: {} as any, // TODO
    Polygon: {} as any, // TODO
  },
  mapEntity: {
    mapEntity: {} as any, // TODO
  },
};

// filters types for a given superType (index in views)
type TypesOf<S extends keyof Views> = keyof Views[S];
// filters fields for a given superType and type
type FieldsOf<S extends SuperTypeNames, T extends TypesOf<S>> = keyof Views[S][T];

export function getConfigViewField<
  S extends SuperTypeNames,
  T extends TypesOf<S>,
  F extends FieldsOf<S, T>
>(superType: S, type: T, fieldKey: F): ConfigurationView | undefined {
  return viewTree[superType][type][fieldKey] as ConfigurationView;
}

// Not used yet
export function getConfigView<S extends SuperTypeNames, T extends TypesOf<S>>(
  superType: S,
  type: T
): Views[S][T] | undefined {
  return viewTree[superType][type];
}

function getEditionLevel(view: ConfigurationView | undefined): EditionLevel {
  if (view) {
    if (Editor.getFeatures().INTERNAL) {
      return view.expert;
    }
    if (Editor.getFeatures().ADVANCED) {
      return view.advanced;
    }
    return view.basic;
  }
  return 'editable'; // ok ?
}

export function isHidden<S extends SuperTypeNames, T extends TypesOf<S>, F extends FieldsOf<S, T>>(
  superType: S,
  type: T,
  fieldKey: F
) {
  const view = getConfigViewField(superType, type, fieldKey);
  const editionLevel: EditionLevel = getEditionLevel(view);
  return editionLevel === 'hidden';
}

export function isReadonly<
  S extends SuperTypeNames,
  T extends TypesOf<S>,
  F extends FieldsOf<S, T>
>(superType: S, type: T, fieldKey: F) {
  const view = getConfigViewField(superType, type, fieldKey);
  const editionLevel: EditionLevel = getEditionLevel(view);
  return editionLevel !== 'editable';
}

// example
isHidden('trigger', 'trigger', 'mandatory');
