// -------------------------------------------------------------------------------------------------
// Brancardage
// -------------------------------------------------------------------------------------------------

import { taskLogger } from "../../../tools/logger";
import { getPriorityByCategoryId } from "../../pretri/triage";
import { Actor } from "../actors/actor";
import { TranslationKey } from "../baseTypes";
import { AddRadioMessageLocalEvent, AllResourcesReleaseLocalEvent, PatientMovedLocalEvent, TaskStatusChangeLocalEvent } from "../localEvents/localEventBase";
import { localEventManager } from "../localEvents/localEventManager";
import { Resource } from "../resources/resource";
import { LOCATION_ENUM } from "../simulationState/locationState";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import { getNextNonTransportedPatientByPriority, getNonTransportedPatientsSize, getPatient } from "../simulationState/patientState";
import { TaskResourcesGroup } from "./resources";
import { DefaultTask } from "./taskBase";
import * as ResourceState from "../simulationState/resourceStateAccess";
import * as TaskState from "../simulationState/taskStateAccess";

export class PorterTask extends DefaultTask {

  private GROUP_SIZE = 2;
  private TIME_REQUIRED_FOR_TRANSPORT = 120;
  private TIME_REQUIRED_FOR_SELF_TRANSPORT = 60;

  private resourcesGroups: TaskResourcesGroup[] = [];
  private instructedToMovePatients: string[] = [];

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number,
    readonly feedbackAtEnd : TranslationKey,
  ) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  private isAlreadyGroupMember(resourceId: number): boolean {
	  return this.resourcesGroups.find(group => group.resources.find(groupedResourceId => groupedResourceId === resourceId)) !== undefined
  }

  private cleanupUnallocatedResourcesAndGroups(allocatedResources: Resource[]) {
	  for (const resourceGroup of this.resourcesGroups) {
		for (const resourceId of resourceGroup.resources) {
			if (allocatedResources.find(resource => resource.Uid === resourceId) === undefined){
				//if resource not found, then delete complete group
				this.resourcesGroups.splice(this.resourcesGroups.indexOf(resourceGroup), 1);
			}
		}
	  }
  }

  private groupUnallocatedResources(allocatedResources: Resource[]) {
	const toBeGroupedResources: number[] = [];
	allocatedResources.map(resource => {
		if (!this.isAlreadyGroupMember(resource.Uid)) {
			toBeGroupedResources.push(resource.Uid);
		}
	});
	
	while ( toBeGroupedResources.length >= this.GROUP_SIZE ) {
		const taskGroup = new TaskResourcesGroup(toBeGroupedResources.splice(0, this.GROUP_SIZE));
		this.resourcesGroups.push(taskGroup);

	}
  }

  private getAssignedToResourcesGroupPatientIds(): string[] {
	  return this.resourcesGroups.filter(resourceGroup => resourceGroup.transportingPatientId !== undefined).map(resourceGroup => resourceGroup.transportingPatientId!);
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean {
	return getNonTransportedPatientsSize(state) > 0;
  }

  protected dispatchInProgressEvents(state: Readonly<MainSimulationState>, timeJump: number): void {
    // check if we have the capacity to do something
    if (!TaskState.hasEnoughResources(state, this)) {
		taskLogger.info("Not enough resources!");
      	return;
    }
	taskLogger.info("Patients not transported before action: " + getNonTransportedPatientsSize(state));
	taskLogger.debug("Current porter groups: ", this.resourcesGroups);


	//1. cleanup instance groups according to new allocated resources information
	this.cleanupUnallocatedResourcesAndGroups(ResourceState.getAllocatedResourcesAnyKind(state, this.Uid));

	//2. Group resources not grouped yet
  	this.groupUnallocatedResources(ResourceState.getAllocatedResourcesAnyKind(state, this.Uid));

	//3. move patients
	taskLogger.info("Instructed to move: ", this.instructedToMovePatients);
	this.resourcesGroups.map(resourceGroup => {
		const assignedToResourcesGroupPatients: string[] = this.getAssignedToResourcesGroupPatientIds();
		let nextPatient;
		if (resourceGroup.transportingPatientId)
			nextPatient = getPatient(state, resourceGroup.transportingPatientId);
		else
			nextPatient = getNextNonTransportedPatientByPriority(state, this.instructedToMovePatients.concat(assignedToResourcesGroupPatients));

		if (nextPatient) {
			if (
				(nextPatient.preTriageResult &&
				(getPriorityByCategoryId(nextPatient.preTriageResult.categoryId!) === 1 ||
				getPriorityByCategoryId(nextPatient.preTriageResult.categoryId!) === 2 ||
				!nextPatient.preTriageResult.vitals["vitals.canWalk"]))
				||
				(!nextPatient.humanBody.state.vitals.canWalk)
				) {
				//3.a cannot walk, handle transport
				//timejump is enough to transport patient, so we just move it and unassign patient
				if ((resourceGroup.cumulatedUnusedTime + timeJump) >= this.TIME_REQUIRED_FOR_TRANSPORT){
					resourceGroup.cumulatedUnusedTime = (resourceGroup.cumulatedUnusedTime + timeJump) - this.TIME_REQUIRED_FOR_TRANSPORT;
					nextPatient.location = LOCATION_ENUM.PMA; //TODO: implement better logic
					resourceGroup.transportingPatientId = undefined;
				}
				else {
					//timejump is not enough, we cumulate time and assign patient to group
					resourceGroup.transportingPatientId = nextPatient.patientId
					resourceGroup.cumulatedUnusedTime += timeJump;
				}
			}
			else {
				//3.a can walk, instruct to move
				// Even if resources are removed, action will be completed by patient, just fire an event
				localEventManager.queueLocalEvent(new PatientMovedLocalEvent(0, state.getSimTime()+this.TIME_REQUIRED_FOR_SELF_TRANSPORT, this.Uid, nextPatient.patientId, LOCATION_ENUM.PMA));
				this.instructedToMovePatients.push(nextPatient.patientId)
				resourceGroup.transportingPatientId = undefined;
			}
		}
	});

	taskLogger.info("Patients not transported after action: " + getNonTransportedPatientsSize(state));
	
	//4. completed
	if (getNonTransportedPatientsSize(state) === 0){
			this.resourcesGroups = [];
			localEventManager.queueLocalEvent(new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'Completed'));
			localEventManager.queueLocalEvent(new AllResourcesReleaseLocalEvent(0, state.getSimTime(), this.Uid));

			// FIXME See to whom and from whom
			state.getAllActors().forEach(actor => {
				localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(0, state.getSimTime(), actor!.Uid, 'resources', this.feedbackAtEnd));
			});
		}
		
  }

  override clone(): this { 
    const clone = new PorterTask(this.title, this.description, this.nbMinResources, this.nbMaxResources, this.feedbackAtEnd);
    clone.status = this.status;
    return clone as this;
  }

}