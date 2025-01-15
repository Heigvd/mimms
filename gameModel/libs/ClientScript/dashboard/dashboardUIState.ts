import { InterventionRole } from '../game/common/actors/actor';
import { RadioType } from '../game/common/radio/communicationType';
import { getSimStartDateTime } from '../gameInterface/main';
import { MultiplayerMatrix } from '../multiplayer/multiplayerManager';

export interface TimeForwardDashboardParams {
  mode: 'add' | 'set';
  addMinute: number | undefined;
  setHour: number | undefined;
  setMinute: number | undefined;
}

export interface DashboardUIStateCtx {
  state: DashboardUIState;
  setState: (s: DashboardUIState) => void;
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
    channel: RadioType;
    message: string;
    roles: Partial<Record<InterventionRole, boolean>>;
  };
  openTeams: Record<number, boolean>;
  selectedTeam: number;
  time: TimeForwardDashboardParams;
  minForwardTime: Date;
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
      channel: RadioType.CASU,
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
      addMinute: undefined,
      setHour: undefined,
      setMinute: undefined,
    },
    minForwardTime: getSimStartDateTime(),
    roleConfig: [],
    modalState: ModalState.None,
  };
}

export function resetModals(): void {
  resetModalCustom(Context.dashboardState);
}

export function resetModalCustom(dashboardState: DashboardUIStateCtx): void {
  const newState = Helpers.cloneDeep<DashboardUIState>(dashboardState.state);

  newState.radio.message = '';
  newState.radio.channel = RadioType.CASU;
  newState.radio.mode = 'radio';
  newState.radio.roles = {
    AL: true,
    LEADPMA: false,
    ACS: false,
    MCS: false,
    EVASAN: false,
  };
  newState.roleConfig = [];
  newState.time.addMinute = undefined;
  newState.time.setHour = undefined;
  newState.time.setMinute = undefined;
  newState.minForwardTime = getSimStartDateTime();

  newState.modalState = ModalState.None;
  newState.selectedTeam = 0;

  dashboardState.setState(newState);
}

export function hideModals(): void {
  setModalState(ModalState.None, false);
}

export function setModalState(
  modalType: ModalState,
  selectTeam: boolean,
  minTimeUpdate: Date | undefined = undefined
): void {
  const newState = Helpers.cloneDeep<DashboardUIState>(Context.dashboardState.state);
  newState.modalState = modalType;
  newState.selectedTeam = selectTeam ? Context.team?.id : 0;
  if (minTimeUpdate) {
    newState.minForwardTime = minTimeUpdate;
    newState.time.setHour = minTimeUpdate.getHours();
    newState.time.setMinute = minTimeUpdate.getMinutes();
  }
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
  return Context?.dashboardState?.state as DashboardUIState;
}

export function hasSelectedTeam(): boolean {
  return getTypedDashboardUIState()?.selectedTeam !== 0;
}
