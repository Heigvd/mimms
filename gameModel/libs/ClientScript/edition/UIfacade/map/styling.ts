import {
  DEFAULT_SELECTED_COLOR,
  DEFAULT_UNSELECTED_COLOR,
  getFeatureStyle,
  MapColorConfig,
} from '../../../gameMap/styling/activablesLayerStyles';
import { hasSelectedLocationBinding, isLinkedMapEntitySelected } from '../../UIfacade/map/utils';

export function getScenaristLayerStyle(feature: any): LayerStyleObject {
  // TODO query scenarist context for selection
  const colors: MapColorConfig = getFeatureColor(feature);
  return getFeatureStyle(feature, colors);
}

function getFeatureColor(feature: any): MapColorConfig {
  const currentLocation = hasSelectedLocationBinding(feature);
  const currentMapEntity = isLinkedMapEntitySelected(feature);
  let currentColor = DEFAULT_UNSELECTED_COLOR;
  let opacity = 0.5;
  //const currentMapObject = isLinkedMapObjectSelected(feature);

  if (currentLocation) {
    currentColor = DEFAULT_SELECTED_COLOR;
    if (currentMapEntity) {
      opacity = 1;
    }
  }
  return { color: currentColor, opacity: opacity };
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
      width: 1.5,
    },
    radius: 6,
  };

  return { stroke: strokeStyle, fill, image: circleStyle };
}
