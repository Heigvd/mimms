import {
  GenericScenaristInterfaceState,
  getInitialPageState,
  PAGE_CONTEXT_KEY,
} from '../UIfacade/genericConfigFacade';

export class ContextHandler<IPartialState extends GenericScenaristInterfaceState> {
  constructor() {}

  public getTypedContext(): IPartialState {
    return Context[PAGE_CONTEXT_KEY]?.state ?? getInitialPageState();
  }

  getCurrentState(): IPartialState {
    return Helpers.cloneDeep(this.getTypedContext());
  }

  setState(modifiedState: IPartialState) {
    const clone = Helpers.cloneDeep(modifiedState);
    Context[PAGE_CONTEXT_KEY].setState(clone);
  }
}
