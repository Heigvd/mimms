export enum ActionType {
  ACTION = 'ACTION',
  CASU_RADIO = 'CASU_RADIO',
  ACTORS_RADIO = 'ACTORS_RADIO',
  RESOURCES_RADIO = 'RESOURCES_RADIO',
  EVASAN_RADIO = 'EVASAN_RADIO',
}

export type RadioType =
  | ActionType.CASU_RADIO
  | ActionType.ACTORS_RADIO
  | ActionType.RESOURCES_RADIO
  | ActionType.EVASAN_RADIO;
