import { ActorId } from '../../game/common/baseTypes';
import { LOCATION_ENUM } from '../../game/common/simulationState/locationState';
import { getChoiceDescriptor } from '../../game/loaders/mapEntitiesLoader';
import { getTypedInterfaceState } from '../../gameInterface/interfaceState';
import { floatToHexByte, getLetterRepresentationOfIndex } from '../../tools/helper';
import { getActor } from '../../UIfacade/actorFacade';

export const DEFAULT_COLOR = '#3CA3CC';

export interface MapColorConfig {
  /**
   * Highlight / selection color
   */
  highlight: string;
  /**
   * Unselected objects color
   */
  normal: string;
  //inProgress: string,
  inProgressOpacity: number;
  unselectedOpacity: number;
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
  return DEFAULT_COLOR;
}

export function getActivableLayerStyle(feature: any): LayerStyleObject {
  const { currentActorUid, currentActionUid, selectedActionChoiceUid } = getTypedInterfaceState();
  const interfaceColor = getInterfaceColor(currentActorUid);
  const choiceDescriptor = getChoiceDescriptor(currentActionUid, selectedActionChoiceUid);
  const isSelected = feature?.getProperties()?.id === choiceDescriptor?.placeholder;
  const selectionActive = Context.mapState?.state?.mapSelect === true;
  const isIncident = feature?.getProperties()?.binding === LOCATION_ENUM.chantier;

  const colors: MapColorConfig = {
    highlight: interfaceColor,
    normal: isIncident ? '#FFFFFF' : '#7f868a', // TODO figure out depending on icons ?
    inProgressOpacity: 0.5,
    unselectedOpacity: 0.5,
  };
  return getFeatureStyle(feature, isSelected, selectionActive, colors);
}

/**
 * computes the style of a given feature
 * @param interfaceColor the dominant/selection color
 * @param (player) indicate whether the feature is currently selected, ignored if selectionActive is false
 * @param (player) true if in selection mode
 */
export function getFeatureStyle(
  feature: any,
  isSelected: boolean,
  selectionActive: boolean,
  colors: MapColorConfig
): LayerStyleObject {
  const geometryType = feature.getProperties()?.type;

  switch (geometryType) {
    case 'Point':
      return getPointStyle(feature, isSelected, selectionActive, colors);
    case 'LineString':
      return getLineStringStyle(feature, isSelected, selectionActive, colors);
    case 'Polygon':
      return getPolygonStyle(feature, isSelected, selectionActive, colors);
    default:
      return getUnsupportedFeatureStyle(feature);
  }
}

function getPointStyle(
  feature: any,
  isSelected: boolean,
  selectionActive: boolean,
  colors: MapColorConfig
): LayerStyleObject {
  // Unused but all availables properties, can be freely extended in activablesLayer
  const { index, icon, buildStatus, label, rotation } = feature.getProperties();
  const isInProgress = buildStatus === 'pending';

  if (icon) {
    // TODO icons svg are black thus color is useless
    const iconStyle: IconStyleObject = {
      type: 'IconStyle',
      anchor: [0.5, 0.5],
      displacement: [0, 30],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: `/maps/mapIcons/${icon}.svg`,
      scale: 0.1,
      opacity: isInProgress ? colors.inProgressOpacity : 1,
      color: colors.normal,
    };

    const textStyle: TextStyleObject = {
      type: 'TextStyle',
      opacity: isInProgress ? colors.inProgressOpacity : 1,
    };

    const [offsetX, offsetY] = getLabelOffset(feature);

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

    // Arrowheads
    // TODO specifically designed for access and egress (text on arrow heads)
    // should be thought again (text centered on middle of feature instead ?)
    if (rotation !== undefined) {
      iconStyle.rotation = rotation;
      iconStyle.displacement = [0, 0];
      iconStyle.color = colors.highlight;
      iconStyle.scale = 0.08;

      textStyle.text = label;
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
        color: colors.highlight,
        lineCap: 'round',
        lineJoin: 'round',
      };

      if (selectionActive) {
        const alpha = floatToHexByte(colors.unselectedOpacity);
        iconStyle.color = colors.highlight + (isSelected ? 'ff' : alpha);
        iconStyle.opacity = isSelected ? 1 : colors.unselectedOpacity;
        textStyle.opacity = iconStyle.opacity;
        //textStyle.text = '';
      }
    }

    return { image: iconStyle, text: textStyle };
  }

  return {}; // TODO Add fallback style for scenarist ?
}

function getLineStringStyle(
  feature: any,
  isSelected: boolean,
  selectionActive: boolean,
  colors: MapColorConfig
): LayerStyleObject {
  const { buildStatus } = feature.getProperties();
  const isInProgress = buildStatus === 'pending';

  const alpha = floatToHexByte(colors.inProgressOpacity);
  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: colors.highlight + (isInProgress ? alpha : 'ff'),
    width: 6,
    lineCap: 'round',
    lineJoin: 'round',
  };

  if (selectionActive) {
    strokeStyle.color = colors.highlight + (isSelected ? 'ff' : alpha);
  }

  return { stroke: strokeStyle };
}

function getPolygonStyle(
  feature: any,
  isSelected: boolean,
  selectionActive: boolean,
  colors: MapColorConfig
): LayerStyleObject {
  // TODO figure out why build status isn't needed for polygons

  const { index, label } = feature.getProperties();

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: colors.normal,
  };

  const stroke: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: colors.normal,
    lineCap: 'round',
    lineJoin: 'round',
    width: 5,
  };

  const [offsetX, offsetY] = getLabelOffset(feature);

  const text: TextStyleObject = {
    type: 'TextStyle',
    // If we are in a selection state we use alphabetical index, otherwise we apply the name
    text: selectionActive
      ? getLetterRepresentationOfIndex(parseInt(index, 10))
      : label || 'No name',
    font: 'bold 10px sans-serif',
    textAlign: 'center',
    scale: 1.6,
    fill: {
      type: 'FillStyle',
      color: 'white',
    },
    offsetX: offsetX,
    offsetY: offsetY,
  };

  if (selectionActive) {
    const alpha = floatToHexByte(colors.unselectedOpacity);
    stroke.color = colors.highlight + (isSelected ? 'ff' : alpha);
    fill.color = colors.highlight + (isSelected ? 'ff' : alpha);
  }

  return { fill, stroke, text };
}

function getUnsupportedFeatureStyle(feature: any): LayerStyleObject {
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
