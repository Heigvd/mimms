import { EnhancedCellData, MatrixConfig } from '../edition/MatrixEditor';
import { getCurrentPresetSortedPatientIds } from '../game/pretri/drill';
import { compare } from '../tools/helper';

type PatientId = string;
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

let loading = false;

export function updatePatientDashboard() {
  const ctx = Context;
  APIMethods.runScript('PatientDashboard.overview();', {}).then(response => {
    dashboard = response.updatedEntities[0] as PatientDashboard;
    loading = false;
    ctx.patientDashboardState.setState(s => ({ toggle: !s.toggle }));
  });
}

const onChangeRef = 'no-op';
Helpers.useRef(onChangeRef, () => {});

export function getMatrix(): MatrixConfig<CatId, PatientId, CellConfig> {
  if (dashboard) {
    let filteredDashboard = Object.entries(dashboard);
    const preset = getCurrentPresetSortedPatientIds();
    if (preset) {
      filteredDashboard = filteredDashboard.filter(([k, _]) => {
        return preset.indexOf(k) > -1;
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
        },
      ),
      cellDef: [],
      onChangeRefName: onChangeRef,
    };
  } else {
    if (!loading) {
      updatePatientDashboard();
      loading = true;
    }
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
