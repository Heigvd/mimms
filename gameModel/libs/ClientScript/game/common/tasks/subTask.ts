import { PatientId, ResourceId, SubTaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';

const baseSeed = 4200;

export class SubTask {
  private static IdSeed = baseSeed;
  public readonly subTaskId: SubTaskId;

  /** The resources involved in the execution of the sub-task */
  public resources: ResourceId[];
  /** The patient involved in the sub-task */
  public patientId: PatientId;
  /** The time spent on the task */
  public cumulatedTime: number;

  public constructor(resources: ResourceId[], patientId: PatientId) {
    this.subTaskId = SubTask.IdSeed++;
    this.resources = resources;
    this.patientId = patientId;
    this.cumulatedTime = 0;
  }

  static resetIdSeed() {
    this.IdSeed = baseSeed;
  }
}

export class PorterSubTask extends SubTask {
  public targetLocation: LOCATION_ENUM;
  public patientCanWalk: boolean;

  constructor(
    resources: ResourceId[],
    patientId: string,
    targetLocation: LOCATION_ENUM,
    patientCanWalk: boolean
  ) {
    super(resources, patientId);
    this.targetLocation = targetLocation;
    this.patientCanWalk = patientCanWalk;
  }
}
