export interface GameOptions {
  respectHierarchy: boolean;
}

export function getCurrentGameOptions(): GameOptions {
  return {
    respectHierarchy: getHierarchyOption(),
  };
}

function getHierarchyOption(): boolean {
  return Variable.find(gameModel, 'respectHierarchy').getValue(self);
}
