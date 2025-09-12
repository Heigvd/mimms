import { GenericScenaristInterfaceState } from '../UIfacade/genericConfigFacade';
import {
  GenericSubStateKey,
  getMenuUISubState,
  setMenuUISubState,
} from '../UIfacade/mainMenuStateFacade';

export class ContextHandler<IPartialState extends GenericScenaristInterfaceState> {
  constructor(readonly key: GenericSubStateKey) {}

  public getTypedContext(): IPartialState {
    return getMenuUISubState<IPartialState>(this.key);
  }

  getCurrentState(): IPartialState {
    return Helpers.cloneDeep(this.getTypedContext());
  }

  setState(modifiedState: IPartialState) {
    const clone = Helpers.cloneDeep(modifiedState);
    setMenuUISubState<IPartialState>(this.key, clone);
  }
}
