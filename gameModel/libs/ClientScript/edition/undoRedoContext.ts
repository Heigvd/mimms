import { Uid } from '../game/common/interfaces';

type StateType<IS, DataType> = [IS, Record<string, DataType>];

// TODO could be
/*
type StateTypeAlt<IS,DataType> = {
  interfaceState: IS,
  data: Record<string, DataType>
}*/

export class UndoRedoContext<IState, DataT> {
  private currentStateIndex: number = 0;
  private currentSaveIndex: number = 0;

  private stateStack: StateType<IState, DataT>[];

  constructor(initialInterfaceState: IState, initialData: Record<Uid, DataT>) {
    this.stateStack = [[initialInterfaceState, initialData]];
  }

  public canUndo(): boolean {
    return this.currentStateIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentStateIndex + 1 < this.stateStack.length;
  }

  public undo(): StateType<IState, DataT> {
    if (this.canUndo()) {
      this.currentStateIndex--;
    }
    return this.getCurrentState();
  }

  public redo(): StateType<IState, DataT> {
    if (this.canRedo()) {
      this.currentStateIndex++;
    }
    return this.getCurrentState();
  }

  public isSaved(): boolean {
    return this.currentSaveIndex === this.currentStateIndex;
  }

  public getCurrentState(): StateType<IState, DataT> {
    return this.stateStack[this.currentStateIndex]!;
  }

  public onSave(): void {
    this.currentSaveIndex = this.currentStateIndex;
  }

  public storeState(interfaceState: IState, dataState: Record<string, DataT>): void {
    this.currentStateIndex++;
    this.stateStack.slice(0, this.currentStateIndex);
    this.stateStack.push([interfaceState, dataState]);
  }
}
