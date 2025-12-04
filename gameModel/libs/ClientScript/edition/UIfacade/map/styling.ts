import {
  DEFAULT_SELECTED_COLOR,
  DEFAULT_UNSELECTED_COLOR,
  getFeatureStyle,
  MapColorConfig,
} from '../../../gameMap/styling/activablesLayerStyles';
import { hasSelectedLocationBinding, isLinkedMapEntitySelected } from '../../UIfacade/map/utils';

export function getScenaristLayerStyle(feature: any): LayerStyleObject {
  // TODO query scenarist context for selection
  const colors: MapColorConfig = {
    color : getFeatureColor(feature),
    opacity: 0.8
  };
  return getFeatureStyle(feature, colors);
}

function getFeatureColor(feature: any): string {
  const currentLocation = hasSelectedLocationBinding(feature);
  const currentMapEntity = isLinkedMapEntitySelected(feature);
  //const currentMapObject = isLinkedMapObjectSelected(feature);

  if (currentMapEntity) {
    return DEFAULT_SELECTED_COLOR;
  } else if (currentLocation) {
    return '#8AC8E0';
  }
  // TODO amazing stuff for color
  return DEFAULT_UNSELECTED_COLOR;
}

export function getDrawStyle(_feature: any): LayerStyleObject {
  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: '#3CA3CC',
    width: 3,
    lineCap: 'round',
    lineJoin: 'round',
  };

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: '#3CA3CC' + '50',
  };

  const circleStyle: CircleStyleObject = {
    type: 'CircleStyle',
    fill: {
      type: 'FillStyle',
      color: '#3CA3CC',
    },
    stroke: {
      type: 'StrokeStyle',
      color: '#FFFFFF',
      width: 2,
    },
    radius: 4,
    // opacity: 1, TODO Not working for some odd reason
  };

  return { stroke: strokeStyle, fill, image: circleStyle };
}
