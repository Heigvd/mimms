import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// ActionBase relies on Wegas globals and on modules that only exist in the Wegas runtime
(globalThis as any).Helpers = {
  getLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
};

let uid = 0;
jest.mock('../_common/gameModel/libs/ClientScript/tools/logger', () => ({
  actionLogger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../_common/gameModel/libs/ClientScript/tools/translation', () => ({
  getTranslation: jest.fn(),
}));
jest.mock(
  '../_common/gameModel/libs/ClientScript/game/executionContext/gameExecutionContextController',
  () => ({ getContextUidGenerator: () => ({ getNext: () => ++uid }) })
);
jest.mock('../_common/gameModel/libs/ClientScript/game/common/impacts/effect', () => ({}));
jest.mock(
  '../_common/gameModel/libs/ClientScript/game/common/localEvents/localEventManager',
  () => ({})
);
jest.mock(
  '../_common/gameModel/libs/ClientScript/game/common/simulationState/activableState',
  () => ({})
);

import { StartEndAction } from '../_common/gameModel/libs/ClientScript/game/common/actions/actionBase';

class TestAction extends StartEndAction {
  public calls: string[] = [];

  constructor(startTime: number, duration: number) {
    super(startTime, duration, 1, 'name', 1, 'template' as any);
  }

  protected dispatchInitEvents(): void {
    this.calls.push('start');
  }

  protected dispatchEndedEvents(): void {
    this.calls.push('end');
  }
}

function stateAt(simTime: number): any {
  return { getSimTime: () => simTime, getInternalStateObject: () => ({ flags: {} }) };
}

describe('StartEndAction.update', () => {
  beforeEach(() => {
    uid = 0;
  });

  it('is Uninitialized before its start time', () => {
    const action = new TestAction(60, 120);
    action.update(stateAt(0));
    expect(action.getStatus()).toBe('Uninitialized');
    expect(action.calls).toEqual([]);
  });

  it('starts at its start time and stays OnGoing for a positive duration', () => {
    const action = new TestAction(0, 120);
    action.update(stateAt(0));
    expect(action.getStatus()).toBe('OnGoing');
    expect(action.calls).toEqual(['start']);

    action.update(stateAt(60));
    expect(action.getStatus()).toBe('OnGoing');
    expect(action.calls).toEqual(['start']);
  });

  it('completes when its end time is reached', () => {
    const action = new TestAction(0, 120);
    action.update(stateAt(0));
    action.update(stateAt(120));
    expect(action.getStatus()).toBe('Completed');
    expect(action.calls).toEqual(['start', 'end']);
  });

  it('starts and completes in a single update when duration is 0', () => {
    const action = new TestAction(0, 0);
    action.update(stateAt(0));
    expect(action.getStatus()).toBe('Completed');
    expect(action.calls).toEqual(['start', 'end']);
  });

  it('does not do anything once Completed', () => {
    const action = new TestAction(0, 0);
    action.update(stateAt(0));
    action.update(stateAt(60));
    expect(action.calls).toEqual(['start', 'end']);
  });

  it('sets provided flags when completing', () => {
    const flags: Record<string, boolean> = {};
    const state: any = { getSimTime: () => 0, getInternalStateObject: () => ({ flags }) };
    const action = new TestAction(0, 0);
    action.provideFlagsToState = ['flagA' as any];
    action.update(state);
    expect(flags['flagA']).toBe(true);
  });
});
