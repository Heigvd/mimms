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
