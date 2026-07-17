import { createHumanBody, defaultMeta } from '../HUMAn/human';
import { DataDef, MatrixConfig } from './MatrixEditor';
import { getActs, getItems } from '../HUMAn/registries';
import { getEnv, parse, parseObjectDescriptor } from '../tools/WegasHelper';
import { compare } from '../tools/helper';
import { getActTranslation, getItemActionTranslation } from '../tools/translation';

function extractAllKeys(obj: object, currentKey: string, list: string[]) {
  Object.entries(obj).forEach(([k, v]) => {
    const key = `${currentKey ? `${currentKey}.` : ''}${k}`;
    if (v instanceof Object) {
      extractAllKeys(v, key, list);
    } else {
      list.push(key);
    }
  });
}

/**
 * Used to extract all vitals keys as string.
 *
 * Used one in a while
 *
 * please keep it
 */
// ts-unused-exports:disable-next-line
export function extractVitalKeys() {
  // Instantiate a body
  const env = getEnv();
  const meta = defaultMeta;
  const initialBody = createHumanBody(meta!, env);

  const vitals = initialBody.state.vitals;

  const list: string[] = [];
  extractAllKeys(vitals, '', list);

  return list.map(key => ({ label: key, key }));
}

/**
 * Used to extract all blocks as string.
 *
 * Used one in a while
 *
 * please keep it
 */
// ts-unused-exports:disable-next-line
export function extractBlockChoices() {
  // Instantiate a body
  const env = getEnv();
  const meta = defaultMeta;
  const initialBody = createHumanBody(meta, env);

  const choices: { label: string; value: string }[] = [];
  initialBody.state.blocks.forEach(b => {
    choices.push({
      label: b.name,
      value: b.name,
    });
  });
  return choices;
}

export function getBlocksSelector() {
  const blockChoices = extractBlockChoices();
  return {
    type: 'array',
    required: true,
    view: {
      label: 'Block(s)',
      layout: 'longInline',
    },
    items: {
      type: 'string',
      view: {
        type: 'select',
        choices: blockChoices,
      },
    },
  };
}

/**
 * Skill Definitions Edition
 */

type SkillId = string;
/**
 * act::id | item::itemId::actionId
 */
type ActionId = string;

export type SkillLevel = 'low_skill' | 'high_skill';

type SkillMatrixCell = undefined | SkillLevel;

type SkillOnChangeFn = (x: DataDef<SkillId>, y: DataDef<ActionId>, value: SkillMatrixCell) => void;

const SkillOnChangeRefName = 'skillDefOnChange';

const onSkillChangeRef = Helpers.useRef<SkillOnChangeFn>(SkillOnChangeRefName, () => {});

export interface SkillDefinition {
  name?: string;
  actions?: Record<ActionId, SkillLevel>;
}

const noSkill: SkillDefinition = {
  name: 'unskilled',
  actions: {},
};

export function getSkillDefinition(skillId?: string): SkillDefinition {
  if (!skillId) {
    return noSkill;
  }

  const sdef = Variable.find(gameModel, 'skillsDefinitions').getProperties()[skillId];
  return parse<SkillDefinition>(sdef || '') || noSkill;
}

onSkillChangeRef.current = (x, y, newData) => {
  const skillId = x.id;
  const actionId = y.id;

  const def = getSkillDefinition(skillId);

  if (newData) {
    if (def.actions == null) {
      def.actions = {};
    }
    def.actions[actionId] = newData;
  } else {
    if (def.actions) {
      delete def.actions[actionId];
    }
  }

  const script = `Variable.find(gameModel, "skillsDefinitions").setProperty('${skillId}',
		 ${JSON.stringify(JSON.stringify(def))});`;

  APIMethods.runScript(script, {});
};

function getSkillsDefinitions() {
  return parseObjectDescriptor<SkillDefinition>(Variable.find(gameModel, 'skillsDefinitions'));
}

export function getSkillsDefinitionsAsChoices() {
  const situations = getSkillsDefinitions();
  const choices = Object.entries(situations).map(([situId, situDef]) => ({
    label: situDef.name || situId,
    value: situId,
  }));
  choices.push({
    label: 'none',
    value: '',
  });
  return choices;
}

export function getSkillActId(actId: string) {
  return `act::${actId}`;
}

export function getSkillItemActionId(itemId: string, actionId: string) {
  return `item::${itemId}::${actionId}`;
}

export function getSkillsDefsMatrix(): MatrixConfig<SkillId, ActionId, SkillMatrixCell> {
  const actActions = getActs()
    .map(act => ({
      label: `Act ${getActTranslation(act)}`,
      id: getSkillActId(act.id),
    }))
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    });

  const itemActions = getItems()
    .flatMap(item => {
      return Object.entries(item.item.actions).map(([actionId, action], i, entries) => {
        return {
          label: getItemActionTranslation(item.item, actionId),
          id: getSkillItemActionId(item.id, actionId),
        };
      });
    })
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    });

  const skills = getSkillsDefinitions();

  const matrix: Record<SkillId, Record<ActionId, SkillMatrixCell>> = {};

  Object.entries(skills).forEach(([skillDef, situDef]) => {
    matrix[skillDef] = {};
    Object.entries(situDef.actions || {}).forEach(([actionId, value]) => {
      matrix[skillDef]![actionId] = value;
    });
  });

  return {
    y: [...actActions, ...itemActions],
    x: Object.entries(skills)
      .sort(([, a], [, b]) => compare(a.name, b.name))
      .map(([situId, situ]) => ({
        id: situId,
        label: situ?.name || 'no name',
      })),
    data: matrix,
    cellDef: [
      {
        type: 'enum',
        label: 'no',
        values: [undefined],
      },
      {
        type: 'enum',
        label: 'low',
        values: ['low_skill'],
      },
      {
        type: 'enum',
        label: 'high',
        values: ['high_skill'],
      },
    ],
    onChangeRefName: SkillOnChangeRefName,
  };
}
