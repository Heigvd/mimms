import { ActionType } from '../game/common/actionType';
import { InterventionRole } from '../game/common/actors/actor';
import { MultiplayerMatrix } from '../multiplayer/multiplayerManager';

export interface TimeForwardDashboardParams {
  mode: 'add' | 'set';
  addMinute: number;
  setHour: number;
  setMinute: number;
}

export interface DashboardUIState {
  state: boolean;
  roles: boolean;
  impacts: boolean;
  locations: boolean;
  timeModal: boolean;
  radioModal: boolean;
  radio: {
    mode: 'radio' | 'notif';
    channel: ActionType;
    message: string;
    roles: Partial<Record<InterventionRole, boolean>>;
  };
  openTeams: Record<number, boolean>;
  selectedTeam: number;
  time: TimeForwardDashboardParams;
  configureRoles: boolean;
  /** local state for the role selection modal */
  roleConfig: MultiplayerMatrix;
}

export function getInitialDashboardUIState(): DashboardUIState {
  return {
    state: true,
    roles: true,
    impacts: true,
    locations: false,
    timeModal: false,
    radioModal: false,
    radio: {
      mode: 'radio',
      channel: ActionType.CASU_RADIO,
      message: '',
      roles: {
        AL: true,
        LEADPMA: false,
        ACS: false,
        MCS: false,
        EVASAN: false,
      },
    },
    openTeams: {},
    selectedTeam: 0,
    time: {
      mode: 'add',
      addMinute: 0,
      setHour: 0,
      setMinute: 0,
    },
    configureRoles: false,
    roleConfig: [],
  };
}

export function resetModals(): void {
  const newState = Helpers.cloneDeep<DashboardUIState>(Context.dashboardState.state);

  newState.radio.message = '';
  newState.time.addMinute = 0;
  newState.time.setHour = 0;
  newState.time.setMinute = 0;
  newState.timeModal = false;
  newState.radioModal = false;
  newState.configureRoles = false;

  Context.dashboardState.setState(newState);
}

export function toggleInterventionRole(playerId: number, role: InterventionRole): void {
  const newState = Helpers.cloneDeep<DashboardUIState>(Context.dashboardState.state);
  const playerMat = newState.roleConfig.find(pm => pm.id === playerId)!;
  const value = playerMat?.roles[role];
  playerMat.roles[role] = !value;
  Context.dashboardState.setState(newState);
}

export function getTypedDashboardUIState(): DashboardUIState {
  return Context.dashboardState.state as DashboardUIState;
}

export function hasSelectedTeam(): boolean {
  return getTypedDashboardUIState()?.selectedTeam !== 0;
}
