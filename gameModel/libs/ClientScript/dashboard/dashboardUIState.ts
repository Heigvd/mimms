import { ActionType } from '../game/common/actionType';
import { InterventionRole } from '../game/common/actors/actor';

export interface DashboardUIState {
  state: boolean;
  roles: boolean;
  impacts: boolean;
  locations: boolean;
  allTeamsTimeModal: boolean;
  allTeamsRadioModal: boolean;
  radio: {
    mode: 'radio' | 'notif';
    channel: ActionType;
    message: string;
    roles: Partial<Record<InterventionRole, boolean>>;
  };
  line: boolean;
}

export function getInitialDashboardUIState(): DashboardUIState {
  return {
    state: true,
    roles: true,
    impacts: true,
    locations: false,
    allTeamsTimeModal: false,
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
  };
}
