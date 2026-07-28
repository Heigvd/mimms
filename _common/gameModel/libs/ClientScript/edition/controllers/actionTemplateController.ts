import { TemplateDescriptor } from '../../game/common/actions/actionTemplateDescriptor/templateDescriptor';
import { ActionTemplateConfigUIState } from '../UIfacade/actionConfigFacade';
import { ActionValidationContext } from '../typeDefinitions/validation/validationContext';
import { Uid } from '../../game/common/interfaces';
import {
  FlatActionTemplate,
  fromFlatActionTemplate,
  getTemplateDef,
  getTemplateValidator,
  toFlatActionTemplate,
} from '../typeDefinitions/templateDefinition';
import { ChoiceDescriptor } from '../../game/common/actions/choiceDescriptor/choiceDescriptor';
import {
  FlatChoice,
  fromFlatChoice,
  getChoiceDefinition,
  toFlatChoice,
} from '../typeDefinitions/choiceDefinition';
import { Effect } from '../../game/common/impacts/effect';
import {
  FlatEffect,
  fromFlatEffect,
  getEffectDefinition,
  toFlatEffect,
} from '../typeDefinitions/effectDefinition';
import { Impact } from '../../game/common/impacts/impact';
import {
  FlatImpact,
  fromFlatImpact,
  getImpactDefinition,
  toFlatImpact,
} from '../typeDefinitions/impactDefinition';
import { group } from '../../tools/groupBy';
import { scenarioEditionLogger } from '../../tools/logger';
import { getChildren } from './parentedUtils';
import { ValidationMessage } from '../typeDefinitions/definition';
import { getInitialActionTemplateUIState } from './controllerInstances';
import { getItemTyped } from '../UIfacade/genericConfigFacade';
import {
  ActionTemplateFlatType,
  CreationOptionsBase,
  DataControllerBase,
  SuperTypeNames,
} from './dataControllerBase';

export class ActionTemplateDataController extends DataControllerBase<
  TemplateDescriptor,
  ActionTemplateFlatType,
  ActionTemplateConfigUIState,
  CreationOptionsBase,
  ActionValidationContext
> {
  // TODO filter by mandatory
  protected override isSibling(
    _target: ActionTemplateFlatType,
    _candidate: ActionTemplateFlatType
  ): boolean {
    return true;
  }

  private static readonly ACTION_ROOT: string = 'ACTION_ROOT';

  protected override flatten(
    tree: Record<Uid, TemplateDescriptor>
  ): Record<Uid, ActionTemplateFlatType> {
    const flattened: Record<Uid, ActionTemplateFlatType> = {};
    Object.entries(tree).forEach(([uid, tpld]) => {
      flattened[uid] = toFlatActionTemplate(tpld, ActionTemplateDataController.ACTION_ROOT);
      // choices
      tpld.choices.forEach((choice: ChoiceDescriptor) => {
        flattened[choice.uid] = toFlatChoice(choice, tpld.uid);
        // effects
        choice.effects.forEach((effect: Effect) => {
          flattened[effect.uid] = toFlatEffect(effect, choice.uid);
          // impacts
          effect.impacts.forEach((impact: Impact) => {
            flattened[impact.uid] = toFlatImpact(impact, effect.uid);
          });
        });
      });
    });
    return flattened;
  }

  protected override recompose(
    flattened: Record<Uid, ActionTemplateFlatType>
  ): Record<Uid, TemplateDescriptor> {
    const tree: Record<Uid, TemplateDescriptor> = {};

    const groups = group(Object.values(flattened), elem => elem.superType);
    groups.action?.forEach(flatAction => {
      tree[flatAction.uid] = fromFlatActionTemplate(flatAction as FlatActionTemplate);
    });

    const choices: Record<Uid, ChoiceDescriptor> = {};
    groups.choice?.forEach(flatChoice => {
      const parent = tree[flatChoice.parent];
      if (parent) {
        const c = fromFlatChoice(flatChoice as FlatChoice);
        choices[c.uid] = c;
        parent.choices.push(c);
      } else {
        scenarioEditionLogger.error('Found some orphan choice', flatChoice);
      }
    });

    const effects: Record<Uid, Effect> = {};
    groups.effect?.forEach(flatEffect => {
      const parent = choices[flatEffect.parent];
      if (parent) {
        const ef = fromFlatEffect(flatEffect as FlatEffect);
        effects[ef.uid] = ef;
        parent.effects.push(ef);
      } else {
        scenarioEditionLogger.error('Found some orphan effect', flatEffect);
      }
    });

    groups.impact?.forEach(flatImpact => {
      const parent = effects[flatImpact.parent];
      if (parent) {
        const i = fromFlatImpact(flatImpact as FlatImpact);
        parent.impacts.push(i);
      } else {
        scenarioEditionLogger.error('Found some orphan impact', flatImpact);
      }
    });

    return tree;
  }

  protected override createNewInternal(
    parentId: Uid,
    superType: ActionTemplateFlatType['superType'],
    options: CreationOptionsBase
  ): ActionTemplateFlatType {
    switch (superType) {
      case 'action': {
        const action = toFlatActionTemplate(
          getTemplateDef('FullyConfigurableTemplateDescriptor')!.getDefault(),
          ActionTemplateDataController.ACTION_ROOT
        );
        this.assignNewTagName(action);
        return action;
      }
      case 'choice': {
        const choice = toFlatChoice(getChoiceDefinition().getDefault(), parentId);
        this.assignNewTagName(choice);
        return choice;
      }
      case 'effect': {
        const effect = toFlatEffect(getEffectDefinition().getDefault(), parentId);
        this.assignNewTagName(effect);
        return effect;
      }
      case 'impact': {
        return toFlatImpact(
          getImpactDefinition('empty', options.parentType).getDefault(),
          parentId
        );
      }
    }
  }

  protected override duplicateInternal(original: ActionTemplateFlatType): ActionTemplateFlatType[] {
    const cloned: ActionTemplateFlatType[] = [];
    const mapping: Record<Uid, Uid> = {};
    this.duplicateRecursively(original, mapping, cloned);

    if (cloned.length > 0) {
      const topLevelClone = cloned[0];
      if (topLevelClone && topLevelClone.superType !== 'impact') {
        this.assignNewTagName(topLevelClone);
      }
    }

    cloned.forEach(clone => {
      // patch cross references impacts targets
      if (clone.type === 'activation' || clone.type === 'mapActivation') {
        if (mapping[clone.target]) {
          clone.target = mapping[clone.target]!;
        }
      } else if (clone.type === 'effectSelection') {
        if (mapping[clone.target]) {
          clone.target = mapping[clone.target]!;
        }
        if (mapping[clone.targetEffect]) {
          clone.targetEffect = mapping[clone.targetEffect]!;
        }
      }

      // patch default effect reference
      if (clone.type === 'choice' && mapping[clone.defaultEffect]) {
        clone.defaultEffect = mapping[clone.defaultEffect]!;
      }
    });

    return cloned;
  }

  private duplicateRecursively(
    original: ActionTemplateFlatType,
    mapping: Record<Uid, Uid>,
    cloned: ActionTemplateFlatType[]
  ) {
    const clone: ActionTemplateFlatType = super.basicDuplicate(original, mapping);
    cloned.push(clone);

    switch (clone.superType) {
      case 'action':
      case 'choice':
      case 'effect':{
        const children = Object.values(getChildren(original.uid, this.getFlatDataClone()));
        children.forEach(child => this.duplicateRecursively(child, mapping, cloned));
        break;
      }
    }
  }

  private assignNewTagName(newObject: FlatActionTemplate | FlatChoice | FlatEffect): void {
    // fetch the already existing siblings
    const siblings = getChildren(newObject.parent, this.getFlatData());
    let candidate = newObject.tag;
    let i = 2;
    while (
      Object.values(siblings).some(obj => obj.superType !== 'impact' && obj.tag === candidate)
    ) {
      candidate = newObject.tag + ' ' + i;
      i++;
    }
    newObject.tag = candidate;
  }

  protected validateInternal(
    value: TemplateDescriptor
  ): ValidationMessage<ActionValidationContext>[] {
    return getTemplateValidator(value.type)(value, {
      page: 'actions',
      targetState: getInitialActionTemplateUIState(),
    });
  }

  public override select(itemType: SuperTypeNames, uid: Uid | undefined): void {
    super.select(itemType, uid);
    if (itemType === 'choice' && uid) {
      const choice = getItemTyped('choice', uid);
      if (choice) {
        const istate = this.getLatestIState();
        // if one effect only, hide the effect section by default
        const effectCount = Object.values(this.getFlatData()).filter(
          item => item.parent === choice.uid
        ).length;
        istate.effectOpen = effectCount !== 1;
        this.updateIState(istate);

        if (!istate.selected['effect']) {
          super.select('effect', choice.defaultEffect);
        }
      }
    }
  }

  public override unselect(itemType: SuperTypeNames): void {
    switch (itemType) {
      case 'action':
        super.unselect('action');
      // eslint-disable-next-line no-fallthrough
      case 'choice':
        super.unselect('choice');
      // eslint-disable-next-line no-fallthrough
      case 'effect':
        super.unselect('effect');
      // eslint-disable-next-line no-fallthrough
      default:
        super.unselect('impact');
    }
  }
}
