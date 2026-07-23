import { TargetedEvent } from '../game/common/events/baseEvent';
import {
  getSkillActId,
  getSkillDefinition,
  getSkillItemActionId,
  SkillDefinition,
  SkillLevel,
} from '../edition/GameModelerHelper';
import { Point } from './point2D';
import { BodyFactoryParam, Environnment } from '../HUMAn/human';
import {
  getCompensationModel,
  getOverdriveModel,
  getSystemModel,
} from '../HUMAn/physiologicalModel';
import { getAct, getItem, getPathology } from '../HUMAn/registries';
import { checkUnreachable, NumberVariableClasses } from './helper';
import { getActTranslation, getItemActionTranslation } from './translation';
import { HumanTreatmentEvent, PathologyEvent } from '../game/common/events/eventTypes';

export function parse<T>(meta: string): T | null {
  try {
    return JSON.parse(meta) as T;
  } catch {
    return null;
  }
}

interface Serie {
  label: string;
  points: Point[];
}

interface Graph {
  id: string;
  series: Serie[];
}

type RawPoints = [number, number][];

function findObjectDescriptor(vdName: string): SObjectDescriptor | undefined {
  const variable = Variable.find(gameModel, vdName as keyof VariableClasses);
  if (variable.getJSONClassName() === 'ObjectDescriptor') {
    return variable as SObjectDescriptor;
  }
  return undefined;
}

function loadVitalsSeries(vdName: string): Graph[] {
  const obj = findObjectDescriptor(vdName);
  const properties = obj != null ? obj.getInstance(self).getProperties() : {};

  const keys = Object.keys(properties).sort();

  const graphs = keys.map(key => {
    const parsed = JSON.parse(properties[key]!);

    const data = Array.isArray(parsed)
      ? // 1 serie: array xy tuple [[x,y], ..., [x,y]]
        [{ label: key, points: (parsed as RawPoints).map(([x, y]) => ({ x, y })) }]
      : // many series:  {"serie1":[[x,y], ..., [x,y], "serie2":[[x,y], ..., [x,y]}
        Object.entries(parsed).map(([k, v]) => {
          return {
            label: k,
            points: (v as RawPoints).map(([x, y]) => ({ x, y })),
          };
        });

    return {
      id: key,
      series: data,
    };
  });

  return graphs;
}

export function getVitalsSeries() {
  return loadVitalsSeries('output');
}

export function getCardioVitalsSeries() {
  return loadVitalsSeries('outputCardio');
}

export function getOtherVitalsSeries() {
  return loadVitalsSeries('outputOther');
}

function getRawHumanBodyParams() {
  return Variable.find(gameModel, 'patients').getProperties();
}

export function getHumanIds() {
  const all = getRawHumanBodyParams();
  return Object.keys(all);
}

export function alphaNumericSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

function getPatientIds() {
  return Object.keys(Variable.find(gameModel, 'patients').getProperties());
}

export function getSortedPatientIds() {
  return getPatientIds().sort(alphaNumericSort);
}

export function getBodyParam(humanId: string): BodyFactoryParam | undefined {
  const strP = getRawHumanBodyParams()[humanId];
  if (strP) {
    const parsed = parse<BodyFactoryParam>(strP);
    return parsed ? parsed : undefined;
  } else {
    return undefined;
  }
}

export function getCurrentPatientId(): string {
  return Variable.find(gameModel, 'currentPatient').getValue(self);
}

export function getCurrentPatientBodyParam(): BodyFactoryParam | undefined {
  const patientId = getCurrentPatientId();
  return getBodyParam(patientId);
}

type CleanEvent<T extends TargetedEvent> = Omit<
  T,
  'emitterPlayerId' | 'emitterCharacterId' | 'targetId' | 'targetType'
> & {
  time: number;
};

export type TestScenarioEvent = CleanEvent<PathologyEvent> | CleanEvent<HumanTreatmentEvent>;

export interface TestScenario {
  description: string;
  events: TestScenarioEvent[];
}

export function parseObjectDescriptor<T>(od: SObjectDescriptor): Record<string, T> {
  return Object.entries(od.getProperties()).reduce<{ [k: string]: T }>((acc, [k, v]) => {
    const parsed = parse<T>(v);
    if (parsed !== undefined && parsed !== null) {
      acc[k] = parsed;
    }
    return acc;
  }, {});
}

export function parseObjectInstance<T>(oi: SObjectInstance): Record<string, T> {
  return Object.entries(oi.getProperties()).reduce<{ [k: string]: T }>((acc, [k, v]) => {
    const parsed = parse<T>(v);
    if (parsed) {
      acc[k] = parsed;
    }
    return acc;
  }, {});
}

export function saveToObjectInstance(oi: SObjectInstance, data: object) {
  const newInstance = Helpers.cloneDeep(oi.getEntity());

  Object.entries(data).forEach(([k, v]) => {
    newInstance.properties[k] = JSON.stringify(v);
  });
  APIMethods.updateInstance(newInstance);
}

/**
 * Erase each values with given data
 */
export function dropObjectInstance(oi: SObjectInstance) {
  const newInstance = Helpers.cloneDeep(oi.getEntity());

  newInstance.properties = {};

  APIMethods.updateInstance(newInstance);
}

/**
 * Erase each values with given data
 */
export function clearObjectInstance(oi: SObjectInstance, data: object) {
  const newInstance = Helpers.cloneDeep(oi.getEntity());

  Object.keys(newInstance.properties).forEach(k => {
    newInstance.properties[k] = JSON.stringify(data);
  });

  APIMethods.updateInstance(newInstance);
}

function patchObject<T>(od: SObjectDescriptor, data: Record<string, T>): IObjectDescriptor {
  const newObject = Helpers.cloneDeep(od.getEntity());
  newObject.properties = {};
  Object.entries(data).forEach(([k, v]) => {
    newObject.properties[k] = JSON.stringify(v);
  });
  return newObject;
}

export function saveToObjectDescriptor<T>(od: SObjectDescriptor, data: Record<string, T>): void {
  const newObject = patchObject(od, data);
  APIMethods.updateVariable(newObject);
}

export async function saveToObjectDescriptorAsync<T>(
  od: SObjectDescriptor,
  data: Record<string, T>
): Promise<unknown> {
  const newObject = patchObject(od, data);
  return APIMethods.updateVariableAsync(newObject);
}

export async function updateNumberDescriptor(
  id: keyof NumberVariableClasses,
  newValue: number
): Promise<IManagedResponse> {
  return APIMethods.runScript(`MimmsHelper.updateNumberDescriptor('${id}',${newValue})`, {});
}

export function getPatientsBodyFactoryParams() {
  return parseObjectDescriptor<BodyFactoryParam>(Variable.find(gameModel, 'patients'));
}

export function getPatientsBodyFactoryParamsArray() {
  return Object.entries(getPatientsBodyFactoryParams())
    .map(([id, meta]) => {
      return { id: id, meta: meta };
    })
    .sort((a, b) => {
      return alphaNumericSort(a.id, b.id);
    });
}

/**
 * Pretty print human. Expose internal secret data ! Do not show to players
 * Includes:
 *  - id
 *  - sex, age, height, bmi
 *  - skill
 *  - scriptedEvents
 */
export function prettyPrint(id: string, param: BodyFactoryParam, short: boolean = false): string {
  const skill = param.skillId ? ` [${param.skillId}]` : '';

  const ps = (param.scriptedEvents || [])
    .map(sp => {
      if (sp.payload.type === 'HumanPathology') {
        const def = getPathology(sp.payload.pathologyId);
        return def?.name || '';
      } else if (sp.payload.type === 'HumanTreatment') {
        const source = sp.payload.source;
        if (source.type === 'act') {
          const act = getAct(source.actId);
          if (act) {
            return getActTranslation(act);
          } else {
            return `unknown ${source.actId} act`;
          }
        } else {
          const item = getItem(source.itemId);
          if (item) {
            return getItemActionTranslation(item, source.actionId);
          } else {
            return `unknown ${source.itemId}::${source.actionId} item`;
          }
        }
      } else {
        checkUnreachable(sp.payload);
      }
    })
    .filter(p => p)
    .join(', ');

  return short
    ? `${id} (${param.age}${param.sex === 'male' ? 'M' : 'F'}) ${skill}`
    : `${id} ${skill} (${param.sex}; ${param.age} years; ${param.height_cm}cm; ${param.bmi} (BMI); 2^${param.lungDepth} lungs) ${ps}`;
}

export function sortChoicesByLabel(choices: { label: string; value: string }[]) {
  return [...choices].sort((a, b) => alphaNumericSort(a.label, b.label));
}

function getHumansAsChoices(od: SObjectDescriptor, short: boolean = false) {
  const humans = parseObjectDescriptor<BodyFactoryParam>(od);
  return Object.entries(humans).map(([k, meta]) => {
    if (meta) {
      return {
        value: k,
        label: prettyPrint(k, meta, short),
      };
    } else {
      return { value: k, label: `Unparsable ${k}` };
    }
  });
}

export function getPatientsAsChoices(short: boolean = false) {
  return sortChoicesByLabel(getHumansAsChoices(Variable.find(gameModel, 'patients'), short));
}

export function getEnv(): Environnment {
  return {
    atmosphericPressure_mmHg: Variable.find(gameModel, 'atmP_mmHg').getValue(self),
    FiO2: Variable.find(gameModel, 'fiO2').getValue(self),
  };
}

export function getSystemSeries(): Graph[] {
  const system = getSystemModel();

  const graphs = Object.entries(system).map(([key, value]) => {
    return {
      id: key,
      series: [
        {
          label: key,
          points: value,
        },
      ],
    };
  });

  return graphs;
}

export function getCompensationSeries(): Graph[] {
  const system = getCompensationModel();

  const graphs = Object.entries(system).map(([key, value]) => {
    return {
      id: key,
      series: [
        {
          label: key,
          points: value.points,
        },
      ],
    };
  });

  return graphs;
}

export function getOverdriveSeries(): Graph[] {
  const system = getOverdriveModel();

  const graphs = Object.entries(system).map(([key, value]) => {
    return {
      id: key,
      series: [
        {
          label: key,
          points: value.points,
        },
      ],
    };
  });

  return graphs;
}

/**
 * Skill of the current pre-triage player (configured via the `defaultSkill` variable)
 */
export function getDefaultSkillDefinition(): SkillDefinition {
  const skillId = Variable.find(gameModel, 'defaultSkill').getValue(self);
  return getSkillDefinition(skillId);
}

/**
 * Current player's skillLevel for the given action
 */
export function getSkillLevelForItemAction(
  itemId: string,
  actionId: string
): SkillLevel | undefined {
  const key = getSkillItemActionId(itemId, actionId);
  const skills = getDefaultSkillDefinition();
  return skills.actions && skills.actions[key];
}

export function getSkillLevelForAct(actId: string): SkillLevel | undefined {
  const key = getSkillActId(actId);
  const skills = getDefaultSkillDefinition();
  return skills.actions && skills.actions[key];
}
