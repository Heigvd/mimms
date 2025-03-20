export function getBuildingsLayer(feature: any, _resolution: number) {
  let buildingStyle: LayerStyleObject = {
    fill: {
      type: 'FillStyle',
      color: '#C5C8C9',
    },
    stroke: {
      type: 'StrokeStyle',
      color: '#656E72',
      width: 1,
      lineCap: 'round',
      lineJoin: 'round',
      miterLimit: 10,
    },
    text: {
      type: 'TextStyle',
      scale: 1.6,
      fill: {
        type: 'FillStyle',
        color: 'white',
      },
    },
  };

  const mapState = Context.mapState?.state;
  const interfaceState = Context.interfaceState?.state;
  // Filter selectFeature from mapFeatures[] and flatMap it to an array of ids

  // Is a selection action currently being performed ?
  if (mapState?.mapSelect && mapState?.selectionState?.featureKey) {
    // We get the index of the current feature from the selectables
    const index =
      mapState.selectionState.featureIds.indexOf(feature.get(mapState.selectionState.featureKey)) +
      1;

    // The feature is selectable but not the current one
    if (
      mapState.selectionState.featureIds.includes(feature.get(mapState.selectionState.featureKey))
    ) {
      buildingStyle.fill!.color = '#3CA3CC80';
      buildingStyle.text!.text = String(index);
    }

    // The feature is selectable and is the current one
    if (
      mapState.selectionState.featureIds[interfaceState.selectedMapObjectId] ===
      feature.get(mapState.selectionState.featureKey)
    ) {
      buildingStyle.fill!.color = '#3CA3CC';
      buildingStyle.text!.text = String(index);
    }
  }

  return buildingStyle;
}
