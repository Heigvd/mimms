import { DEFAULT_COLOR, getFeatureStyle } from '../../../gameMap/styling/activablesLayerStyles';

export function getScenaristLayerStyle(feature: any): LayerStyleObject {
  // TODO query scenarist context for selection (category selected etc.)
  const isSelected = true;
  const color = getFeatureColor(feature);
  return getFeatureStyle(feature, color, isSelected, false);
}

function getFeatureColor(_feature: any): string {
  //const properties = feature.getProperties();

  // TODO amazing stuff for color
  return DEFAULT_COLOR;
}
