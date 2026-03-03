import { EnhancedCellData, MatrixConfig } from '../edition/MatrixEditor';
import { PatientId } from '../game/common/baseTypes';
import { compare } from '../tools/helper';
import { getSortedPatientIds } from '../tools/WegasHelper';

type CellConfig = number;

interface PatientSummary {
  notCategorized: number;
  correct: number;
  underCategorized: number;
  overCategorized: number;
}

type CatId = keyof PatientSummary;

type PatientDashboard = Record<PatientId, PatientSummary>;

let dashboard: PatientDashboard = {};

let firstLoadDone = false;

export function updatePatientDashboard(force: boolean) {
  if (!force && firstLoadDone) return;

  const ctx = Context;
  APIMethods.runScript('PatientDashboard.overview();', {}).then(response => {
    firstLoadDone = true;
    dashboard = response.updatedEntities[0] as PatientDashboard;
    // force render
    ctx.patientDashboardState.setState((s: { toggle: boolean }) => ({ toggle: !s.toggle }));
  });
}

const onChangeRef = 'no-op';
Helpers.useRef(onChangeRef, () => {});

export function getMatrix(): MatrixConfig<CatId, PatientId, CellConfig> {
  if (dashboard) {
    let filteredDashboard = Object.entries(dashboard);
    const patients = getSortedPatientIds();
    if (patients) {
      filteredDashboard = filteredDashboard.filter(([k, _]) => {
        return patients.indexOf(k) > -1;
      });
    }
    return {
      y: filteredDashboard
        .sort(([k1, _], [k2, __]) => compare(k1, k2))
        .map(([patientId, _]) => {
          return {
            id: patientId,
            label: patientId,
          };
        }),
      x: [
        { id: 'notCategorized', label: 'not categorized' },
        { id: 'correct', label: 'correct' },
        { id: 'underCategorized', label: 'underCategorized' },
        { id: 'overCategorized', label: 'overCategorized' },
      ],
      data: Object.entries(dashboard).reduce<
        Record<CatId, Record<PatientId, EnhancedCellData<number>>>
      >(
        (acc, [patientId, summary]) => {
          Object.entries(summary).forEach(([catId, value]) => {
            acc[catId as CatId][patientId] = { label: String(value || 0), value: value || 0 };
          });

          return acc;
        },
        {
          notCategorized: {},
          correct: {},
          underCategorized: {},
          overCategorized: {},
        }
      ),
      cellDef: [],
      onChangeRefName: onChangeRef,
    };
  } else {
    updatePatientDashboard(false);
    return {
      x: [],
      y: [],
      data: {
        notCategorized: {},
        correct: {},
        underCategorized: {},
        overCategorized: {},
      },
      cellDef: [],
      onChangeRefName: onChangeRef,
    };
  }
}
