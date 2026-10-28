/**
 * How an actor communicates with resources.
 */
export enum CommMedia {
  Direct = 'Direct', // live face to face talk
  Radio = 'Radio', // by radio
}

export enum RadioType {
  CASU = 'CASU',
  ACTORS = 'ACTORS',
  RESOURCES = 'RESOURCES',
  EVASAN = 'EVASAN',
}

export enum NotifType {
  NOTIF = 'NOTIF',
}

export type CommType = RadioType | NotifType;
