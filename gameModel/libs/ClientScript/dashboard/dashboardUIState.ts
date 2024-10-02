import { ActionType } from '../game/common/actionType';
import { InterventionRole } from '../game/common/actors/actor';

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
    setHour: string;
    setMinute: string;
  };
  configureRoles: boolean;
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
      setHour: '',
      setMinute: '',
    },
    configureRoles: false,
  };
}

export function resetModals(): void {
  const newState = Helpers.cloneDeep(Context.dashboardState.state);

  newState.radio.message = '';
  newState.teamTimeModal = false;
  newState.allTeamsTimeModal = false;
  newState.teamRadioModal = false;
  newState.allTeamsRadioModal = false;

  Context.dashboardState.setState(newState);
}
