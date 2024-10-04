import { ActionType } from '../game/common/actionType';
import { InterventionRole } from '../game/common/actors/actor';
import { MultiplayerMatrix } from '../multiplayer/multiplayerManager';

export interface DashboardUIState {
  state: boolean;
  roles: boolean;
  impacts: boolean;
  locations: boolean;
  teamTimeModal: boolean;
  allTeamsTimeModal: boolean;
  teamRadioModal: boolean;
  allTeamsRadioModal: boolean;
  radio: {
    mode: 'radio' | 'notif';
    channel: ActionType;
    message: string;
    roles: Partial<Record<InterventionRole, boolean>>;
  };
  openTeams: Record<number, boolean>;
  selectedTeam: number;
  time: {
    mode: 'add' | 'set';
    add: number;
    setHour: number;
    setMinute: number;
  };
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
    teamTimeModal: false,
    allTeamsTimeModal: false,
    teamRadioModal: false,
    allTeamsRadioModal: false,
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
      add: 0,
      setHour: 0,
      setMinute: 0,
    },
    configureRoles: false,
    roleConfig: [],
  };
}

export function resetModals(): void {
  const newState = Helpers.cloneDeep(Context.dashboardState.state);

  newState.radio.message = '';
  newState.time.add = 0;
  newState.time.setHour = 0;
  newState.time.setMinute = 0;
  newState.teamTimeModal = false;
  newState.allTeamsTimeModal = false;
  newState.teamRadioModal = false;
  newState.allTeamsRadioModal = false;
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
