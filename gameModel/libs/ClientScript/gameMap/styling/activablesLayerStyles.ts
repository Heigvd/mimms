import { ActorId } from '../../game/common/baseTypes';
import { getChoiceDescriptor } from '../../game/loaders/mapEntitiesLoader';
import { getTypedInterfaceState } from '../../gameInterface/interfaceState';
import { getLetterRepresentationOfIndex } from '../../tools/helper';
import { getActor } from '../../UIfacade/actorFacade';

export const DEFAULT_COLOR = '#3CA3CC';

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
  const isSelected = feature?.getProperties()?.id === choiceDescriptor?.displayedMapEntity;
  const selectionActive = Context.mapState?.state?.mapSelect === true;

  return getFeatureStyle(feature, interfaceColor, isSelected, selectionActive);
}

/**
 * computes the style of a given feature
 * @param interfaceColor the dominant/selection color
 * @param (player) indicate whether the feature is currently selected, ignored if selectionActive is false
 * @param (player) true if in selection mode
 */
export function getFeatureStyle(
  feature: any,
  interfaceColor: string,
  isSelected: boolean,
  selectionActive: boolean
): LayerStyleObject {
  const geometryType = feature.getProperties()?.type;

  switch (geometryType) {
    case 'Point':
      return getPointStyle(feature, interfaceColor, isSelected, selectionActive);
    case 'LineString':
      return getLineStringStyle(feature, interfaceColor, isSelected, selectionActive);
    case 'Polygon':
      return getPolygonStyle(feature, interfaceColor, isSelected, selectionActive);
    default:
      return getUnsupportedFeatureStyle(feature);
  }
}

function getPointStyle(
  feature: any,
  interfaceColor: string,
  isSelected: boolean,
  selectionActive: boolean
): LayerStyleObject {
  // Unused but all availables properties, can be freely extended in activablesLayer
  const { index, icon, buildStatus, label, rotation } = feature.getProperties();
  const isInProgress = buildStatus === 'pending';

  if (icon) {
    const iconStyle: IconStyleObject = {
      type: 'IconStyle',
      anchor: [0.5, 0.5],
      displacement: [0, 30],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: `/maps/mapIcons/${icon}.svg`,
      scale: 0.1,
      opacity: isInProgress ? 0.5 : 1,
    };

    const textStyle: TextStyleObject = {
      type: 'TextStyle',
      opacity: isInProgress ? 0.5 : 1,
    };

    const [offsetX, offsetY] = getLabelOffset(feature);

    if (selectionActive && rotation === undefined) {
      iconStyle.src = `/maps/mapIcons/${icon}_choice.svg`;
      iconStyle.color = interfaceColor;
      iconStyle.opacity = isSelected ? 1 : 0.5;

      textStyle.text = getLetterRepresentationOfIndex(parseInt(index, 10));
      textStyle.offsetX = 12 + offsetX;
      (textStyle.offsetY = -38 + offsetY), (textStyle.scale = 1.6);
      textStyle.opacity = isSelected ? 1 : 0.5;
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
      iconStyle.color = interfaceColor;
      iconStyle.scale = 0.08;

      textStyle.text = label;
      textStyle.offsetX = 0.5 + offsetX;
      textStyle.offsetY = -18 + offsetY;
      textStyle.scale = 1.6;
      textStyle.fill = {
        type: 'FillStyle',
        color: 'white',
      };
      textStyle.stroke = {
        type: 'StrokeStyle',
        width: 3,
        color: interfaceColor,
        lineCap: 'round',
        lineJoin: 'round',
      };

      if (selectionActive) {
        iconStyle.color = interfaceColor + (isSelected ? 'ff' : '50');
        iconStyle.opacity = isSelected ? 1 : 0.5;
        textStyle.text = '';
      }
    }

    return { image: iconStyle, text: textStyle };
  }

  return {}; // TODO Add fallback style for scenarist ?
}

function getLineStringStyle(
  feature: any,
  interfaceColor: string,
  isSelected: boolean,
  selectionActive: boolean
): LayerStyleObject {
  const { buildStatus } = feature.getProperties();
  const isInProgress = buildStatus === 'pending';

  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: interfaceColor + (isInProgress ? '50' : 'ff'),
    width: 6,
    lineCap: 'round',
    lineJoin: 'round',
  };

  if (selectionActive) {
    strokeStyle.color = interfaceColor + (isSelected ? 'ff' : '50');
  }

  return { stroke: strokeStyle };
}

function getPolygonStyle(
  feature: any,
  interfaceColor: string,
  isSelected: boolean,
  selectionActive: boolean
): LayerStyleObject {
  // TODO figure out why build status isn't needed for polygons

  const { index, label } = feature.getProperties();

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
    stroke.color = interfaceColor + (isSelected ? 'ff' : '50');
    fill.color = interfaceColor + (isSelected ? 'ff' : '50');
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
