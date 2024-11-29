export interface GameOptions {
  respectHierarchy: boolean;
}

export function getCurrentGameOptions(): GameOptions {
  return {
    respectHierarchy: getHierarchyOption(),
  };
}

// Should we have a generic function ? Should it live elsewhere as a util ?
function getHierarchyOption(): boolean {
  return Variable.find(gameModel, 'respectHierarchy').getValue(self);
}
