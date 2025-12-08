import { ActorId } from '../../game/common/baseTypes';
import { getChoiceDescriptor } from '../../game/loaders/mapEntitiesLoader';
import { getTypedInterfaceState } from '../../gameInterface/interfaceState';
import { floatToHexByte } from '../../tools/helper';
import { getAvailableActionTemplateById, isChoiceTemplate } from '../../UIfacade/actionFacade';
import { getActor, isCurrentActorAtLocation } from '../../UIfacade/actorFacade';

export const DEFAULT_SELECTED_COLOR = '#3CA3CC';
export const DEFAULT_UNSELECTED_COLOR = '#7f868a';

export interface MapColorConfig {
  color: string;
  opacity: number;
}

export function getInterfaceColor(id: ActorId | undefined): string {
  const actor = getActor(id || 0);
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
  return DEFAULT_SELECTED_COLOR;
}

export function getActivableLayerStyle(feature: any): LayerStyleObject {
  const { currentActorUid, currentActionUid, selectedActionChoiceUid } = getTypedInterfaceState();
  const interfaceColor = getInterfaceColor(currentActorUid);
  const selectionActive = Context.mapState?.state?.mapSelect === true;

  const { id, buildStatus, binding } = feature?.getProperties();
  let isHighlighted = true;
  let isSelected = false;

  if (selectionActive) {
    const choiceDescriptor = getChoiceDescriptor(currentActionUid, selectedActionChoiceUid);
    isSelected = id === choiceDescriptor?.placeholder;
    const currentTemplate = getAvailableActionTemplateById(currentActionUid);
    if (currentTemplate && isChoiceTemplate(currentTemplate)) {
      isHighlighted = currentTemplate.choices.some(c => c.placeholder === id);
    }
  } else {
    isHighlighted = isCurrentActorAtLocation(binding);
  }
  //const isIncident = feature?.getProperties()?.binding === LOCATION_ENUM.chantier;

  const color = isHighlighted ? interfaceColor : DEFAULT_UNSELECTED_COLOR;
  let opacity = 1;
  if (selectionActive && !isSelected) {
    opacity = 0.5;
  }
  if (!isHighlighted && buildStatus === 'pending') {
    opacity = 0.5;
  }
  const colors: MapColorConfig = {
    color: color,
    opacity: opacity,
  };
  return getFeatureStyle(feature, colors);
}

/**
 * computes the style of a given feature
 * @param interfaceColor the dominant/selection color
 * @param (player) indicate whether the feature is currently selected, ignored if selectionActive is false
 * @param (player) true if in selection mode
 */
export function getFeatureStyle(feature: any, colors: MapColorConfig): LayerStyleObject {
  const geometryType = feature.getProperties()?.type;

  switch (geometryType) {
    case 'Point':
      return getPointStyle(feature, colors);
    case 'LineString':
      return getLineStringStyle(feature, colors);
    case 'Polygon':
      return getPolygonStyle(feature, colors);
    default:
      return getUnsupportedFeatureStyle(feature, colors);
  }
}

function getPointStyle(feature: any, colors: MapColorConfig): LayerStyleObject {
  // Unused but all availables properties, can be freely extended in activablesLayer
  const { icon, rotation } = feature.getProperties();

  if (icon) {
    const iconStyle: IconStyleObject = {
      type: 'IconStyle',
      anchor: [0.5, 0.5],
      displacement: [0, 30],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: `/maps/mapIcons/${icon}.svg`,
      scale: 0.05,
      opacity: colors.opacity,
      color: colors.color,
    };

    const text = getTextStyle(feature, colors);

    /*
  OLD CODE for phylactère / Speech scroll
    if (selectionActive && rotation === undefined) {
      iconStyle.src = `/maps/mapIcons/${icon}_choice.svg`;
      iconStyle.color = colors.highlight;
      iconStyle.opacity = isSelected ? 1 : colors.unselectedOpacity;

      textStyle.text = getLetterRepresentationOfIndex(parseInt(index, 10));
      textStyle.offsetX = 12 + offsetX;
      textStyle.offsetY = -38 + offsetY;
      textStyle.scale = 1.6;
      textStyle.opacity = isSelected ? 1 : colors.unselectedOpacity;
      textStyle.fill = {
        type: 'FillStyle',
        color: 'white',
      };
    }
*/
    // Arrowheads
    // TODO specifically designed for access and egress (text on arrow heads)
    // should be thought again (text centered on middle of feature instead ?)
    // TODO we should rather emit a triangle when building the features
    if (rotation !== undefined) {
      iconStyle.rotation = rotation;
      iconStyle.displacement = [0, 0];
      iconStyle.color = colors.color;
      iconStyle.scale = 0.08;

      /*textStyle.text = label;
      textStyle.offsetX = 0.5 + offsetX;
      textStyle.offsetY = -18 + offsetY;
      textStyle.scale = 1.6;
      textStyle.fill = {
        type: 'FillStyle',
        color: '#ffffff',
      };
      textStyle.stroke = {
        type: 'StrokeStyle',
        width: 3,
        color: colors.color,
        lineCap: 'round',
        lineJoin: 'round',
      };*/
      return { image: iconStyle };
    }

    return { image: iconStyle, text: text };
  }

  return {}; // TODO Add fallback style for scenarist ?
}

function getLineStringStyle(feature: any, colors: MapColorConfig): LayerStyleObject {
  const alpha = floatToHexByte(colors.opacity);
  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: colors.color + alpha,
    width: 6,
    lineCap: 'round',
    lineJoin: 'round',
  };

  const text = getTextStyle(feature, colors);

  return { stroke: strokeStyle, text: text };
}

function getPolygonStyle(feature: any, colors: MapColorConfig): LayerStyleObject {
  const fillOpacity = colors.opacity * 0.5;
  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: colors.color + floatToHexByte(fillOpacity),
  };

  const stroke: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: colors.color + floatToHexByte(colors.opacity),
    lineCap: 'round',
    lineJoin: 'round',
    width: 5,
  };

  const text = getTextStyle(feature, colors);

  return { fill, stroke, text };
}

function getTextStyle(feature: any, colors: MapColorConfig): TextStyleObject {
  const [offsetX, offsetY] = getLabelOffset(feature);
  const { label } = feature.getProperties();
  const textBackground: FillStyleObject = {
    type: 'FillStyle',
    color: colors.color + floatToHexByte(colors.opacity),
  };
  const textPadding: ExtentLikeObject = [5, 5, 5, 5];
  const text: TextStyleObject = {
    type: 'TextStyle',
    font: 'bold 10px sans-serif',
    offsetX: offsetX,
    offsetY: offsetY,
    text: label,
    textAlign: 'center',
    fill: {
      type: 'FillStyle',
      color: 'white',
    },
    backgroundFill: textBackground,
    padding: textPadding,
    scale: 1.6,
  };
  return text;
}

function getUnsupportedFeatureStyle(feature: any, _colors: MapColorConfig): LayerStyleObject {
  const { label, id } = feature.getProperties();

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: '#970ce8' + '50',
  };

  const stroke: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: '#970ce8',
    lineCap: 'round',
    lineJoin: 'round',
    width: 5,
  };

  const text: TextStyleObject = {
    type: 'TextStyle',
    text: '(id : ' + id + ') ' + label,
    font: 'bold 10px sans-serif',
    textAlign: 'center',
    scale: 1.6,
    fill: {
      type: 'FillStyle',
      color: '#4f0778',
    },
  };
  return { fill, stroke, text };
}

function getLabelOffset(feature: any): [number, number] {
  const { labelOffset } = feature.getProperties();
  let offsetX = 0;
  let offsetY = 0;
  if (labelOffset?.length == 2) {
    offsetX = isNaN(+labelOffset[0]) ? 0 : +labelOffset[0];
    offsetY = isNaN(+labelOffset[1]) ? 0 : +labelOffset[1];
  }
  return [offsetX, offsetY];
}
