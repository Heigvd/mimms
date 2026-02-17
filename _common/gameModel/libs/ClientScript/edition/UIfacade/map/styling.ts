import {
  DEFAULT_SELECTED_COLOR,
  DEFAULT_UNSELECTED_COLOR,
  getFeatureStyle,
  MapColorConfig,
} from '../../../gameMap/styling/activablesLayerStyles';
import {
  hasSelectedLocationBinding,
  isLinkedMapEntitySelected,
  isShowOnMapTarget,
  isShowOnMapTargetSibling,
} from './utils';

const REDUCED_OPACITY = 0.5;

/******** LOCATION VIEW ********/
export function getScenaristLayerStyle(feature: any): LayerStyleObject {
  const colors: MapColorConfig = getFeatureColorMapView(feature);
  return getFeatureStyle(feature, colors);
}

function getFeatureColorMapView(feature: any): MapColorConfig {
  const sharesLocationBinding = hasSelectedLocationBinding(feature);
  const isSelected = isLinkedMapEntitySelected(feature);
  let color = DEFAULT_UNSELECTED_COLOR;
  let opacity = REDUCED_OPACITY;

  if (sharesLocationBinding) {
    color = DEFAULT_SELECTED_COLOR;
    if (isSelected) {
      opacity = 1;
    }
  }
  return { color, opacity };
}

export function getDrawStyle(_feature: any): LayerStyleObject {
  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: DEFAULT_SELECTED_COLOR,
    width: 3,
    lineCap: 'round',
    lineJoin: 'round',
  };

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: DEFAULT_SELECTED_COLOR + '50',
  };

  const circleStyle: CircleStyleObject = {
    type: 'CircleStyle',
    fill: {
      type: 'FillStyle',
      color: DEFAULT_SELECTED_COLOR,
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

/******** ACTION & TRIGGER VIEW ********/

export function getScenaristLayerStyleShowOnMap(feature: any): LayerStyleObject {
  const colors: MapColorConfig = getFeatureColorShowOnMap(feature);
  return getFeatureStyle(feature, colors);
}

function getFeatureColorShowOnMap(feature: any): MapColorConfig {
  let color = DEFAULT_UNSELECTED_COLOR;
  let opacity = REDUCED_OPACITY;

  if (isShowOnMapTarget(feature)) {
    color = DEFAULT_SELECTED_COLOR;
    opacity = 1;
  } else if (isShowOnMapTargetSibling(feature)) {
    color = DEFAULT_SELECTED_COLOR;
  }
  return { color, opacity };
}
