import { MappableById } from "../../../tools/mapById";
import { ActorId } from "../baseTypes";
import { IClonable } from "../interfaces";
import { MainSimulationState } from "../simulationState/mainSimulationState";

export abstract class TaskBase implements IClonable, MappableById<ActorId> {

  public constructor(){

  }
  
  id(): number {
    throw new Error("Method not implemented.");
  }

  public abstract isCompleted(): boolean;

  public abstract addResource(): void;
  public abstract removeResource(): void;

  protected abstract releaseAllResources(): void;

  public abstract updateState(state: Readonly<MainSimulationState>): void;

  public abstract clone(): this;

}