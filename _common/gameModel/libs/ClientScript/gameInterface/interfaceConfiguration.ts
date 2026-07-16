import { getCurrentPlayerActors } from '../UIfacade/actorFacade';

/**
 * Trainer configuration for interface visbility
 */
interface InterfaceConfiguration {
  timeline: {
    hidden: boolean;
  };
  leftPanel: {
    hidden: boolean;
  };
  fixedEntities: {
    hidden: boolean;
  };
  timeForward: {
    hidden: boolean;
  };
}

/**
 * Get the current interface configuration
 */
export function getInterfaceConfiguration(): InterfaceConfiguration {
  return {
    timeline: {
      hidden: false,
    },
    leftPanel: {
      hidden: getCurrentPlayerActors().length === 0,
    },
    fixedEntities: {
      hidden: getCurrentPlayerActors().length === 0,
    },
    timeForward: {
      hidden: getCurrentPlayerActors().length === 0,
    },
  };
}
