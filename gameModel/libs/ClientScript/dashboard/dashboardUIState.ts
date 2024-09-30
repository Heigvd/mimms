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
  line: boolean;
  time: {
    mode: 'add' | 'set';
    add: string;
    setHour: string;
    setMinute: string;
  };
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
    line: false,
    time: {
      mode: 'add',
      add: '',
      setHour: '',
      setMinute: '',
    },
  };
}
