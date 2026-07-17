
Helpers.registerEffect(() => {

  // used in page 4 (Start/Stop button)
  // registers a scenarist friendly layout for a call to server method TimeManager.toggleRunningGlobal();
  ServerMethods.registerGlobalMethod(['TimeManager'], 'toggleRunningGlobal', {
    label: 'Toggle running state for all teams',
    parameters: [],
    returns: undefined,
  });

});
