/**
 * Generate layer style according to geometry type
 *
 * @params feature for which to generate style
 * @returns LayerStyleObject corresponding style
 */
export function getLayerStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();
  const geometryType = properties.type;
  switch (geometryType) {
    case 'Point':
      return getPointStyle(feature);
    case 'LineString':
      return getLineStringStyle(feature);
    case 'MultiLineString':
      return getLineStringStyle(feature);
    case 'Polygon':
      return getPolygonStyle(feature);
    case 'MultiPolygon':
      return getMultiPolygonStyle(feature);
    default:
      return {};
  }
}

/**
 * Generate style for points
 *
 * @params feature for which to generate style
 * @returns LayerStyleObject generated point style
 */
function getPointStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();
  const icon = properties.icon;
  const name = properties.name;
  const rotation = properties.rotation;
  const duration = properties.durationTimeSec;

  if (icon) {
    const iconStyle: IconStyleObject = {
      type: 'IconStyle',
      anchor: [0.5, 0.5],
      displacement: [0, 300],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: `/maps/mapIcons/${icon}.svg`,
      scale: 0.1,
      opacity: 1,
    };

    if (
      Context.mapState.state.selectionState &&
      icon === Context.mapState.state.selectionState.icon &&
      !duration
    ) {
      iconStyle.src = `/maps/mapIcons/${icon}_choice.svg`;
    }

    const textStyle: TextStyleObject = {
      type: 'TextStyle',
    };

    // Arrow-heads are the only icon to be rotated
    if (rotation) {
      iconStyle.rotation = rotation;
      iconStyle.displacement = [0, 0];
      iconStyle.src = '/maps/mapIcons/arrow.svg';
      iconStyle.scale = 0.08;

      textStyle.text = properties.accessType;
      textStyle.offsetX = 0.5;
      textStyle.offsetY = -18;
      textStyle.scale = 1.6;
      textStyle.fill = {
        type: 'FillStyle',
        color: 'white',
      };
      textStyle.stroke = {
        type: 'StrokeStyle',
        width: 3,
        color: '#3CA3CC',
        lineCap: 'round',
        lineJoin: 'round',
      };

      // If selection action and not currently selected
      if (
        !(name === Context.interfaceState.state.selectedMapObjectId) &&
        Context.mapState.state.mapSelect
      ) {
        iconStyle.opacity = 0;
        textStyle.text = '';
      }
    }

    if (
      Context.mapState.state.selectionState &&
      icon === Context.mapState.state.selectionState.icon &&
      !duration
    ) {
      // Convert to int to add 1
      const index = parseInt(name, 10) + 1;
      // Is this feature currently selected ?
      const isSelected = name === Context.interfaceState.state.selectedMapObjectId;
      // Define textStyle for Icons
      textStyle.text = (index + 9).toString(36).toUpperCase();
      textStyle.offsetX = 12;
      textStyle.offsetY = -38;
      textStyle.scale = 1.6;
      // If point is currently selected, we give it half opacity
      textStyle.opacity = isSelected ? 1 : 0.5;
      iconStyle.opacity = isSelected ? 1 : 0.5;
      textStyle.fill = {
        type: 'FillStyle',
        color: 'white',
      };
    }

    return { image: iconStyle, text: textStyle };
  }

  return {};
}

/**
 * Generate style for line string
 *
 * @params feature for which to generate style
 * @returns
 */
function getLineStringStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();
  const name = properties.name;
  const duration = properties.durationTimeSec;

  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: '#3CA3CC',
    width: 6,
    lineCap: 'round',
    lineJoin: 'round',
  };

  // If we're currently performing a selection
  if (
    !(name === Context.interfaceState.state.selectedMapObjectId) &&
    Context.mapState.state.mapSelect &&
    !duration
  ) {
    strokeStyle.color = '#3CA3CC00';
  }

  return { stroke: strokeStyle };
}

/**
 * Generate style for polygons (i.e.: PMA)
 *
 * @params feature for which to generate style
 * @returns LayerStyleObject generated multi polygon style
 */
function getPolygonStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();
  const name = properties.name;

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: '#7f868a',
  };

  const stroke: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: '#7f868a',
    lineCap: 'round',
    lineJoin: 'round',
    width: 5,
  };

  // Convert to int to add 1
  let index;
  if (isNaN(properties.name)) index = properties.name;
  else index = parseInt(properties.name, 10) + 1;

  const text: TextStyleObject = {
    type: 'TextStyle',
    // If we are in a selection state we use alphabetical index, otherwise we apply the name
    text: Context.mapState.state.mapSelect
      ? (index + 9).toString(36).toUpperCase()
      : String(index) || 'No name',
    font: 'bold 10px sans-serif',
    textAlign: 'center',
    scale: 1.6,
    fill: {
      type: 'FillStyle',
      color: 'white',
    },
  };

  // If we're currently performing a selection - for the selected one
  if (
    name === Context.interfaceState.state.selectedMapObjectId &&
    Context.mapState.state.mapSelect
  ) {
    stroke.color = '#3CA3CC';
    fill.color = '#3CA3CC';
  }

  // If we're currently performing a selection - for the other choices
  if (
    name !== Context.interfaceState.state.selectedMapObjectId &&
    Context.mapState.state.mapSelect
  ) {
    stroke.color = '#3CA3CC80';
    fill.color = '#3CA3CC80';
  }

  return { fill, stroke, text };
}

/**
 * Generate style for multi polygons
 *
 * @params feature for which to generate style
 * @returns LayerStyleObject generated multi polygon style
 */
function getMultiPolygonStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: '#BCBFECCC',
  };

  const stroke: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: '#3CA3CC',
    lineCap: 'round',
    lineJoin: 'round',
    width: 5,
  };

  // Convert to int to add 1
  let index;
  if (isNaN(properties.name)) index = properties.name;
  else index = parseInt(properties.name, 10) + 1;

  const text: TextStyleObject = {
    type: 'TextStyle',
    text: String(index) || 'No name',
    textAlign: 'center',
  };

  return { fill, stroke, text };
}
