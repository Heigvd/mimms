import { getEnv, getSortedPatientIds } from '../../tools/WegasHelper';
import { getAllHuman_omniscient, getHealth, getHumanMeta } from '../legacy/the_world';
import { doAutomaticTriage_internal, PreTriageData } from './triage';

interface PatientOverview {
  id: string;
  category: string | undefined;
  liveCategory: string | undefined;
  dead: boolean;
}

export function getPatientsOverview(): PatientOverview[] {
  const humanStates = getAllHuman_omniscient();
  const ids = getSortedPatientIds();

  const env = getEnv();

  return ids.map(id => {
    const state = humanStates[id];
    if (state) {
      const meta = getHumanMeta(id);
      const health = getHealth(id);
      const preTriageData: PreTriageData | undefined = meta
        ? {
            human: {
              state: state.bodyState,
              meta: meta,
            },
            actions: [],
            health: health,
            env: env,
            // do not even try to use any console !
            console: [],
          }
        : undefined;

      const liveResult = preTriageData ? doAutomaticTriage_internal(preTriageData) : undefined;

      return <PatientOverview>{
        id: id,
        category: state.category?.category,
        liveCategory: liveResult?.categoryId,
        dead: (state.bodyState.vitals.cardiacArrest ?? 0) > 0,
      };
    } else {
      return <PatientOverview>{
        id: id,
        category: undefined,
        liveCategory: undefined,
        dead: false,
      };
    }
  });
}
