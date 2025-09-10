export interface Context<IState> {
  state: IState;
  setState: (newState: IState) => void;
}

export class ContextHandler<IState> {
  constructor(readonly key: string) {}

  public getTypedContext(): Context<IState> {
    return Context[this.key] as Context<IState>;
  }

  getCurrentState(): IState {
    return Helpers.cloneDeep(this.getTypedContext().state);
  }

  setState(modifiedState: IState) {
    const clone = Helpers.cloneDeep(modifiedState);
    this.getTypedContext().setState(clone);
  }
}
