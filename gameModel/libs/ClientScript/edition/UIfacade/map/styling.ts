import {
  DEFAULT_COLOR,
  getFeatureStyle,
  MapColorConfig,
} from '../../../gameMap/styling/activablesLayerStyles';

export function getScenaristLayerStyle(feature: any): LayerStyleObject {
  // TODO query scenarist context for selection
  const mainColor = getFeatureColor(feature);
  const colors: MapColorConfig = {
    normal: mainColor,
    highlight: mainColor,
    inProgressOpacity: 1,
    unselectedOpacity: 1,
  };
  return getFeatureStyle(feature, false, false, colors);
}

function getFeatureColor(feature: any): string {
  // TODO amazing stuff for color
  return DEFAULT_COLOR;
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
