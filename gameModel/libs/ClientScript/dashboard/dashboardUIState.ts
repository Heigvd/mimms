import { ActionType } from '../game/common/actionType';
import { InterventionRole } from '../game/common/actors/actor';
import { MultiplayerMatrix } from '../multiplayer/multiplayerManager';

export interface TimeForwardDashboardParams {
  mode: 'add' | 'set';
  addMinute: number;
  setHour: number;
  setMinute: number;
}

export enum ModalState {
  None,
  TimeImpact,
  RadioNotifImpact,
  RolesConfiguration,
}

export interface DashboardUIState {
  state: boolean;
  roles: boolean;
  impacts: boolean;
  locations: boolean;
  radio: {
    mode: 'radio' | 'notif';
    channel: ActionType;
    message: string;
    roles: Partial<Record<InterventionRole, boolean>>;
  };
  openTeams: Record<number, boolean>;
  selectedTeam: number;
  time: TimeForwardDashboardParams;
  /** local state for the role selection modal */
  roleConfig: MultiplayerMatrix;
  modalState: ModalState;
}

export function getInitialDashboardUIState(): DashboardUIState {
  return {
    state: true,
    roles: true,
    impacts: true,
    locations: false,
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
    roleConfig: [],
    modalState: ModalState.None,
  };
}

export function resetModals(): void {
  const newState = Helpers.cloneDeep<DashboardUIState>(Context.dashboardState.state);

  newState.radio.message = '';
  newState.radio.channel = ActionType.CASU_RADIO;
  newState.radio.mode = 'radio';
  newState.radio.roles = {
    AL: true,
    LEADPMA: false,
    ACS: false,
    MCS: false,
    EVASAN: false,
  };
  newState.roleConfig = [];
  newState.time.addMinute = 0;
  newState.time.setHour = 0;
  newState.time.setMinute = 0;

  newState.modalState = ModalState.None;
  newState.selectedTeam = 0;

  Context.dashboardState.setState(newState);
}

export function hideModals(): void {
  setModalState(ModalState.None, false);
}

export function setModalState(modalType: ModalState, selectTeam: boolean): void {
  const newState = Helpers.cloneDeep<DashboardUIState>(Context.dashboardState.state);
  newState.modalState = modalType;
  newState.selectedTeam = selectTeam ? Context.team?.id : 0;
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
