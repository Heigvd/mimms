import { ResourceId } from '../baseTypes';

export class TaskResourcesGroup {
  public resources: ResourceId[];
  public cumulatedUnusedTime: number;
  public transportingPatientId: string | undefined;

  constructor(
    resources: ResourceId[],
    cumulatedUnusedTime: number = 0,
    transportingPatientId: string | undefined = undefined,
  ) {
    this.resources = resources;
    this.cumulatedUnusedTime = cumulatedUnusedTime;
    this.transportingPatientId = transportingPatientId;
  }
}
