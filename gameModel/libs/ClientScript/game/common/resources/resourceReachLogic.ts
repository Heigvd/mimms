import { LOCATION_ENUM } from '../simulationState/locationState';
import { TaskType } from '../tasks/taskBase';

/**
 * How a resource can be reached
 */
export enum CommMedia {
  Direct = 'Direct', // live face to face talk
  Radio = 'Radio', // by radio
}

/**
 * Which communication media can be used to reach a resource
 */
enum AvailabilityCommMedia {
  None = 'None',
  Direct = 'Direct',
  Radio = 'Radio',
  Both = 'Both',
}

/**
 * Define how a resource at some location doing some task can be reached
 */
const communicationMatrix: Record<
  LOCATION_ENUM,
  Partial<Record<TaskType, AvailabilityCommMedia>>
> = {
  chantier: {
    Waiting: AvailabilityCommMedia.Direct,
    Pretriage: AvailabilityCommMedia.Radio,
    Porter: AvailabilityCommMedia.Radio,
    Healing: AvailabilityCommMedia.Radio,
  },
  nidDeBlesses: {
    // no waiting resources on "nid de blessés"
    Pretriage: AvailabilityCommMedia.Both,
    Porter: AvailabilityCommMedia.Both,
    Healing: AvailabilityCommMedia.Both,
  },
  PMA: {
    Waiting: AvailabilityCommMedia.Direct,
    Pretriage: AvailabilityCommMedia.Direct,
    // no brancardage task from PMA
    Healing: AvailabilityCommMedia.Direct,
  },
  pcFront: {
    Waiting: AvailabilityCommMedia.Direct,
    // no other task at PC Front
  },
  PC: {
    Waiting: AvailabilityCommMedia.Direct,
    // no other task at PC San
  },
  ambulancePark: {
    Waiting: AvailabilityCommMedia.Both,
    // no other task at ambulance park
  },
  helicopterPark: {
    Waiting: AvailabilityCommMedia.Both,
    // no other task at helicopter park
  },
  remote: {
    // no way to reach resources which are remote
  },
  AccReg: {
    // no resource can be on access and egress, so no way to reach no one
  },
  // no way to reach resources doing an evacuation
};

export function isReachable(location: LOCATION_ENUM, taskType: TaskType, commMedia: CommMedia) {
  const commMediaAvailable: AvailabilityCommMedia | undefined =
    communicationMatrix[location][taskType];

  if (commMediaAvailable) {
    if (commMedia === CommMedia.Direct) {
      return (
        commMediaAvailable === AvailabilityCommMedia.Direct ||
        commMediaAvailable === AvailabilityCommMedia.Both
      );
    } else if (commMedia === CommMedia.Radio) {
      return (
        commMediaAvailable === AvailabilityCommMedia.Radio ||
        commMediaAvailable === AvailabilityCommMedia.Both
      );
    }
  }

  return false;
}
