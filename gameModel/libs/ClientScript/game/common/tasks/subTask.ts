import { GlobalEventId, HospitalId, PatientId, ResourceId, SubTaskId } from '../baseTypes';
import { LOCATION_ENUM } from '../simulationState/locationState';
import { PatientUnitTypology } from '../evacuation/hospitalType';

const SUB_TASK_SEED_ID: SubTaskId = 5000;

export class SubTask {
  private static idProvider: SubTaskId = SUB_TASK_SEED_ID;

  public static resetIdSeed() {
    SubTask.idProvider = SUB_TASK_SEED_ID;
  }

  public readonly subTaskId: SubTaskId;

  /** The resources involved in the execution of the sub-task */
  public resources: ResourceId[];
  /** The patient involved in the sub-task */
  public patientId: PatientId;
  /** The time spent on the task */
  public cumulatedTime: number;

  public constructor(resources: ResourceId[], patientId: PatientId) {
    this.subTaskId = ++SubTask.idProvider;
    this.resources = resources;
    this.patientId = patientId;
    this.cumulatedTime = 0;
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

type EvacuationSubTaskStatus = 'started' | 'way_to_hospital' | 'way_back' | 'completed';

export class EvacuationSubTask extends SubTask {
  public status: EvacuationSubTaskStatus;
  public hospitalId: HospitalId;
  public patientUnitAtHospital: PatientUnitTypology;
  public doResourcesComeBack: boolean;
  public parentEventId: GlobalEventId;
  public travelTime: number;

  constructor(
    resources: ResourceId[],
    patientId: string,
    hospitalId: HospitalId,
    patientUnitAtHospital: PatientUnitTypology,
    doResourcesComeBack: boolean,
    parentEventId: GlobalEventId,
    travelTime: number
  ) {
    super(resources, patientId);
    this.hospitalId = hospitalId;
    this.patientUnitAtHospital = patientUnitAtHospital;
    this.doResourcesComeBack = doResourcesComeBack;
    this.parentEventId = parentEventId;
    this.travelTime = travelTime;
    this.status = 'started';
  }
}
