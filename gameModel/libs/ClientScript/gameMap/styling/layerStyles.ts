import { ActorId } from '../../game/common/baseTypes';
import { getLetterRepresentationOfIndex } from '../../tools/helper';
import { getActor } from '../../UIfacade/actorFacade';

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

/* Needs to be updated every time the actor is changed!! */
export function setInterfaceColor(id: ActorId): string {
  const actor = getActor(id);
  if (actor) {
    switch (actor.Role) {
      case 'ACS':
        return '#554994';
      case 'MCS':
        return '#539265';
      case 'EVASAN':
        return '#EF5777';
      case 'LEADPMA':
        return '#F78C60';
    }
  }
  return '#3CA3CC';
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
      displacement: [0, 30],
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
      iconStyle.color = setInterfaceColor(Context.interfaceState.state.currentActorUid);
    }

    const textStyle: TextStyleObject = {
      type: 'TextStyle',
    };

    // Arrow-heads are the only icon to be rotated
    if (rotation) {
      iconStyle.rotation = rotation;
      iconStyle.displacement = [0, 0];
      iconStyle.src = `/maps/mapIcons/arrow.svg`;
      iconStyle.color = setInterfaceColor(Context.interfaceState.state.currentActorUid);
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
        color: setInterfaceColor(Context.interfaceState.state.currentActorUid),
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
      // Convert to int
      const index = parseInt(name, 10);
      // Is this feature currently selected ?
      const isSelected = name === Context.interfaceState.state.selectedMapObjectId;
      // Define textStyle for Icons
      textStyle.text = getLetterRepresentationOfIndex(index);
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
    color: setInterfaceColor(Context.interfaceState.state.currentActorUid),
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
    strokeStyle.color = setInterfaceColor(Context.interfaceState.state.currentActorUid) + '00';
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

  // Convert to int
  let index;
  if (isNaN(properties.name)) index = properties.name;
  else index = parseInt(properties.name, 10);

  const text: TextStyleObject = {
    type: 'TextStyle',
    // If we are in a selection state we use alphabetical index, otherwise we apply the name
    text: Context.mapState.state.mapSelect
      ? getLetterRepresentationOfIndex(index)
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
    stroke.color = setInterfaceColor(Context.interfaceState.state.currentActorUid);
    fill.color = setInterfaceColor(Context.interfaceState.state.currentActorUid);
  }

  // If we're currently performing a selection - for the other choices
  if (
    name !== Context.interfaceState.state.selectedMapObjectId &&
    Context.mapState.state.mapSelect
  ) {
    stroke.color = setInterfaceColor(Context.interfaceState.state.currentActorUid) + '50';
    fill.color = setInterfaceColor(Context.interfaceState.state.currentActorUid) + '50';
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
    color: setInterfaceColor(Context.interfaceState.state.currentActorUid),
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

export function getViewSelectionStyle(feature: any): LayerStyleObject {
  const color = '#539265';
  const props = feature.getProperties();

  const stroke: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: color,
    width: 2,
    lineJoin: 'round',
  };
  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: color + '25', // alpha
  };
  const text: TextStyleObject = {
    type: 'TextStyle',
    text: props.name,
    textAlign: 'center',
    fill: {
      type: 'FillStyle',
      color: color,
    },
    font: 'bold 20px sans-serif',
  };
  return { fill, stroke, text };
}
