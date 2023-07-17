import { MainSimulationState } from "../simulationState/mainSimulationState";

export abstract class TaskBase {

  public constructor(){

  }

  public abstract isCompleted(): boolean;

  public abstract addResource(): void;
  public abstract removeResource(): void;

  protected abstract releaseAllResources(): void;

  public abstract updateState(state: Readonly<MainSimulationState>): void;

}