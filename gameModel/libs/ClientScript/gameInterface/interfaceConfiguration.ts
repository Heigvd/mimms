import { getCurrentPlayerActors } from '../UIfacade/actorFacade';

/**
 * Trainer configuration for interface visbility
 */
interface InterfaceConfiguration {
  timeline: {
    hidden: boolean;
    viewNonPlayerActors: boolean;
  };
  leftPanel: {
    hidden: boolean;
  };
  fixedEntities: {
    hidden: boolean;
    viewNonPlayerActors: boolean;
    viewOtherLocationActors: boolean;
  };
  timeForward: {
    hidden: boolean;
  };
}

/**
 * Are players in godView mode
 */
export function isGodView() {
  return Variable.find(gameModel, 'godView').getInstance(self).getValue();
}

/**
 * Get the current interface configuration
 */
export function getInterfaceConfiguration(): InterfaceConfiguration {
  return {
    timeline: {
      hidden: false,
      viewNonPlayerActors: isGodView(),
    },
    leftPanel: {
      hidden: getCurrentPlayerActors().length === 0,
    },
    fixedEntities: {
      hidden: getCurrentPlayerActors().length === 0,
      viewNonPlayerActors: isGodView(),
      viewOtherLocationActors: isGodView(),
    },
    timeForward: {
      hidden: getCurrentPlayerActors().length === 0,
    },
  };
}
