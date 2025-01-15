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
