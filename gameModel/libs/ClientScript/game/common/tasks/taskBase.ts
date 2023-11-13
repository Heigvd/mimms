import { taskLogger } from "../../../tools/logger";
import { getTranslation } from "../../../tools/translation";
import { Actor } from "../actors/actor";
import { SimTime, TaskId, TranslationKey } from "../baseTypes";
import { IClonable } from "../interfaces";
import { MainSimulationState } from "../simulationState/mainSimulationState";
import * as TaskState from "../simulationState/taskStateAccess";


/** The statuses represent the steps of a task evolution */
export type TaskStatus = 'Uninitialized' | 'OnGoing' | 'Paused' | 'Completed' | 'Cancelled';

// -------------------------------------------------------------------------------------------------
// Base
// -------------------------------------------------------------------------------------------------

/**
 * Base class for a task
 */
export abstract class TaskBase implements IClonable {

  private static IdSeed = 1000;
  public readonly Uid: TaskId;

  protected status: TaskStatus;

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number) {
    this.Uid = TaskBase.IdSeed++;
    this.status = 'Uninitialized';
  }

  static resetIdSeed() {
    this.IdSeed = 1000;
  }

  /** Its short name */
  public getTitle(): string {
    return getTranslation('mainSim-actions-tasks', this.title);
  }

  /** Its description to give more details */
  public getDescription(): string {
    return getTranslation('mainSim-actions-tasks', this.description);
  }

  // TODO to be refined with types
  /** The minimum resources needed for the task to be performed */
  public getNbMinResources(): number {
    return this.nbMinResources;
  }

  // TODO to be refined with types
  /** The maximum useful resources. More would be useless */
  public getNbMaxResources(): number {
    return this.nbMaxResources;
  }

  /** The status represents its step of evolution */
  public getStatus(): TaskStatus {
    return this.status;
  }

  // FIXME : can it really be done here ? Or should we localEventManager.queueLocalEvent(..)
  public setStatus(status: TaskStatus): void {
    this.status = status;
  }

  /**
   * TODO could be a pure function that returns a cloned instance
   * @returns True if cancellation could be applied
   */
  // TODO see where it can go
  // Note : based on cancel method on ationBase
  public cancel(): boolean {
    if(this.status === "Cancelled") {
      taskLogger.warn('This action was cancelled already');

    } else if(this.status === 'Completed') {
      taskLogger.error('This action is completed, it cannot be cancelled');
      return false;
    }

    // TODO some way ResourceState.releaseAllResources(state, this);
    this.setStatus('Cancelled');
    return true;
  }

	/** Is the task ready for an actor to allocate resources to start it. Aka can the actor see it to allocate resources. */
	public abstract isAvailable(state : Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean;

  /** Update the state */
  public abstract update(state: Readonly<MainSimulationState>, timeJump: number): void;

  public abstract clone(): this;
}

// -------------------------------------------------------------------------------------------------
// Default
// -------------------------------------------------------------------------------------------------

/**
 * Default behaviour of a task
 */
export abstract class DefaultTask extends TaskBase {

  /** The last time that the task was updated */
  protected lastUpdateSimTime : SimTime | undefined = undefined;

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  protected abstract dispatchInProgressEvents(state: Readonly<MainSimulationState>, timeJump: number): void;

  public update(state: Readonly<MainSimulationState>, timeJump: number): void {
    const enoughResources = TaskState.hasEnoughResources(state, this);

    switch (this.status) {
      case 'Cancelled':
      case 'Completed': {
        taskLogger.debug('no more evolution when the task is cancelled or completed');

        // no more evolution
        break;
      }

      case 'Uninitialized': {
        if (enoughResources) {
          taskLogger.debug('task status : Uninitialized -> OnGoing');

          this.status = "OnGoing";
          this.dispatchInProgressEvents(state, timeJump);
        }

        // no evolution if not enough resources

        break;
      }

      case 'OnGoing': {
        if (enoughResources) {
          taskLogger.debug('task : dispatch local events to update the state');

          this.dispatchInProgressEvents(state, timeJump);
        } else {
          taskLogger.debug('task status : OnGoing -> Paused');

          this.status = "Paused";
        }
        break;
      }

      case 'Paused': {
        if (enoughResources) {
          taskLogger.debug('task status : Paused -> OnGoing');

          this.status = "OnGoing";
          this.dispatchInProgressEvents(state, timeJump);
        }
        break;
      }

      default: {
        taskLogger.error('Undefined status. Cannot update task');

        break;
      }
    }

    this.lastUpdateSimTime = state.getSimTime();
  }
}


// -------------------------------------------------------------------------------------------------
// PreTriage
// -------------------------------------------------------------------------------------------------

/**
 * Default behaviour of a task
 */
/*
export class PreTriageTask extends DefaultTask {

  public constructor(
    readonly title: TranslationKey,
    readonly description: TranslationKey,
    readonly nbMinResources: number,
    readonly nbMaxResources: number,
    //readonly zone: string, // TODO see how represent it
    readonly feedbackAtEnd : TranslationKey,
  ) {
    super(title, description, nbMinResources, nbMaxResources);
  }

  public isAvailable(state: Readonly<MainSimulationState>, actor : Readonly<Actor>): boolean {
    //return state.areZonesAlreadyDefined();
	return getNonPreTriagedPatientsSize(state) > 0;
  }

  protected dispatchInProgressEvents(state: Readonly<MainSimulationState>, timeJump: number): void {
    // check if we have the capacity to do something
    if (!TaskState.hasEnoughResources(state, this)) {
		taskLogger.info("Not enough resources!");
      	return;
    }
		taskLogger.info("Patients not pretriaged before action: " + getNonPreTriagedPatientsSize(state));
		const RESOURCE_EFFICACITY = 1;
		const TIME_REQUIRED_FOR_PATIENT_PRETRI = 60;
		ResourceState.getAllocatedResourcesAnyKind(state, this.Uid).map(resource => {
			if ((resource.cumulatedUnusedTime + timeJump)*RESOURCE_EFFICACITY >= TIME_REQUIRED_FOR_PATIENT_PRETRI){

				(resource as Resource).cumulatedUnusedTime = ((resource.cumulatedUnusedTime + timeJump)*RESOURCE_EFFICACITY) - TIME_REQUIRED_FOR_PATIENT_PRETRI;
				const nextPatient = getNextNonPreTriagedPatient(state);
				if (nextPatient)
					nextPatient.preTriageResult = doPatientAutomaticTriage(nextPatient.humanBody, state.getSimTime())!;
			}
			else {
				(resource as Resource).cumulatedUnusedTime += timeJump;
			}
		});

		taskLogger.info("Patients not pretriaged after action: " + getNonPreTriagedPatientsSize(state));

		if (getNonPreTriagedPatientsSize(state) === 0){
			localEventManager.queueLocalEvent(new TaskStatusChangeLocalEvent(0, state.getSimTime(), this.Uid, 'Completed'));
			localEventManager.queueLocalEvent(new AllResourcesReleaseLocalEvent(0, state.getSimTime(), this.Uid));

			//get distinct pretriage categories with count
			let result = "Result: ";
			Object.entries(getPreTriagedAmountByCategory(state)).forEach(([key, value]) => {
				result += key + ": " + value + "\n";
			});

			// FIXME See to whom and from whom
			state.getAllActors().forEach(actor => {
				localEventManager.queueLocalEvent(new AddRadioMessageLocalEvent(0, state.getSimTime(), actor!.Uid, 'resources', this.feedbackAtEnd + "\n" + result));
			});
		}
  }

  override clone(): this { 
    const clone = new PreTriageTask(this.title, this.description, this.nbMinResources, this.nbMaxResources, this.feedbackAtEnd);
    clone.status = this.status;
    return clone as this;
  }

}

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
	taskLogger.info("Current porter groups: ", this.resourcesGroups);


	//1. cleanup instance groups according to new allocated resources information
	this.cleanupUnallocatedResourcesAndGroups(ResourceState.getAllocatedResourcesAnyKind(state, this.Uid));

	taskLogger.info("Current porter groups after cleanup: ", this.resourcesGroups);

	//2. Group resources not grouped yet
  	this.groupUnallocatedResources(ResourceState.getAllocatedResourcesAnyKind(state, this.Uid));

	taskLogger.info("Current porter groups after grouping: ", this.resourcesGroups);

	//3. move patients
	console.log("INSTRUCTED TO MOVE: ", this.instructedToMovePatients);
	const assignedToResourcesGroupPatients: string[] = this.getAssignedToResourcesGroupPatientIds();
	this.resourcesGroups.map(resourceGroup => {
		let nextPatient;
		if (resourceGroup.transportingPatientId)
			nextPatient = getPatient(state, resourceGroup.transportingPatientId);
		else
			nextPatient = getNextNonTransportedPatientByPriority(state, this.instructedToMovePatients.concat(assignedToResourcesGroupPatients));

		console.log("NEXT PATIENT: ", nextPatient);
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
					console.log("TRANSPORTING");
					resourceGroup.cumulatedUnusedTime = (resourceGroup.cumulatedUnusedTime + timeJump) - this.TIME_REQUIRED_FOR_TRANSPORT;
					nextPatient.location = LOCATION_ENUM.PMA; //TODO: implement better logic
					resourceGroup.transportingPatientId = undefined;
				}
				else {
					console.log("ADDING TO GROUP");
					//timejump is not enough, we cumulate time and assign patient to group
					resourceGroup.transportingPatientId = nextPatient.patientId
					resourceGroup.cumulatedUnusedTime += timeJump;
				}
			}
			else {
				console.log("CAN WALK");
				//3.a can walk, instruct to move
				// Even if resources are removed, action will be completed by patient, just fire an event
				localEventManager.queueLocalEvent(new PatientMovedLocalEvent(0, state.getSimTime()+this.TIME_REQUIRED_FOR_SELF_TRANSPORT, this.Uid, nextPatient.patientId, LOCATION_ENUM.PMA));
				this.instructedToMovePatients.push(nextPatient.patientId)
				resourceGroup.transportingPatientId = undefined;
			}
		}
	});

	taskLogger.info("Current porter groups after treatment: ", this.resourcesGroups);

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

}*/