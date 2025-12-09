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
  // TODO amazing stuff for color
  return { color: currentColor, opacity: opacity };
}

export function getDrawStyle(_feature: any): LayerStyleObject {
  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color: '#3CA3CC', // change la couleur de la ligne du polygone/ligne pendant le dessin
    width: 3, // change la largeur de la ligne du polygone/ligne pendant le dessin
    lineCap: 'round',
    lineJoin: 'round',
  };

  const fill: FillStyleObject = {
    type: 'FillStyle',
    color: '#3CA3CC' + '50', // change la couleur en transparence à l'intérieur du polygone pendant le dessin
  };

  const circleStyle: CircleStyleObject = {
    type: 'CircleStyle',
    fill: {
      type: 'FillStyle',
      color: '#3CA3CC', // change la couleur à l'intérieur du point pendant le dessin
    },
    stroke: {
      type: 'StrokeStyle',
      color: '#FFFFFF', // change la couleur du contour du point pendant le dessin
      width: 1.5, // change la largeur du contour du point pendant le dessin
    },
    radius: 6, // change le rayon du point pendant le dessin
    // opacity: 1, TODO Not working for some odd reason
  };

  return { stroke: strokeStyle, fill, image: circleStyle };
}
