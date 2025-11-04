import { ActorId } from '../../game/common/baseTypes';
import { getChoiceDescriptor } from '../../game/loaders/mapEntitiesLoader';
import { getLetterRepresentationOfIndex } from '../../tools/helper';
import { getActor } from '../../UIfacade/actorFacade';

export function getInterfaceColor(id: ActorId): string {
  const actor = getActor(id);
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
  return '#3CA3CC';
}

export function getActivableLayerStyle(feature: any): LayerStyleObject {
  const properties = feature.getProperties();
  const geometryType = properties.type;

  switch (geometryType) {
    case 'Point':
      return getPointStyle(feature);
    case 'LineString':
      return getLineStringStyle(feature);
    case 'Polygon':
      return getPolygonStyle(feature);
    default:
      return {};
  }
}

function getPointStyle(feature: any): LayerStyleObject {
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

    // Selection
    const choiceDescriptor = getChoiceDescriptor(
      Context.interfaceState.state.currentActionUid,
      Context.interfaceState.state.selectedActionChoiceUid
    );
    const isSelected = feature.values_.id === choiceDescriptor?.placeholder;

    if (Context.mapState.state.mapSelect && !rotation) {
      iconStyle.src = `/maps/mapIcons/${icon}_choice.svg`;
      iconStyle.color = getInterfaceColor(Context.interfaceState.state.currentActorUid);
      iconStyle.opacity = isSelected ? 1 : 0.5;

      textStyle.text = getLetterRepresentationOfIndex(parseInt(index, 10));
      textStyle.offsetX = 12;
      (textStyle.offsetY = -38), (textStyle.scale = 1.6);
      textStyle.opacity = isSelected ? 1 : 0.5;
      textStyle.fill = {
        type: 'FillStyle',
        color: 'white',
      };
    }

    // Arrowheads
    if (rotation) {
      iconStyle.rotation = rotation;
      iconStyle.displacement = [0, 0];
      iconStyle.color = getInterfaceColor(Context.interfaceState.state.currentActorUid);
      iconStyle.scale = 0.08;

      textStyle.text = label;
      textStyle.offsetX = 0.5;
      textStyle.offsetY = -18;
      textStyle.scale = 1.6;
      textStyle.fill = {
        type: 'FillStyle',
        color: 'white',
      };
      textStyle.stroke = {
        type: 'StrokeStyle',
        width: 3,
        color: getInterfaceColor(Context.interfaceState.state.currentActorUid),
        lineCap: 'round',
        lineJoin: 'round',
      };

      if (Context.mapState.state.mapSelect) {
        iconStyle.color =
          getInterfaceColor(Context.interfaceState.state.currentActorUid) +
          (isSelected ? 'ff' : '50');
        iconStyle.opacity = isSelected ? 1 : 0.5;
        textStyle.text = '';
      }
    }

    return { image: iconStyle, text: textStyle };
  }

  return {}; // TODO Add fallback style for scenarist ?
}

function getLineStringStyle(feature: any): LayerStyleObject {
  // Unused but all availables properties, can be freely extended in activablesLayer
  const { buildStatus } = feature.getProperties();
  const isInProgress = buildStatus === 'pending';

  const strokeStyle: StrokeStyleObject = {
    type: 'StrokeStyle',
    color:
      getInterfaceColor(Context.interfaceState.state.currentActorUid) +
      (isInProgress ? '50' : 'ff'),
    width: 6,
    lineCap: 'round',
    lineJoin: 'round',
  };

  // Selection
  if (Context.mapState.state.mapSelect) {
    const choiceDescriptor = getChoiceDescriptor(
      Context.interfaceState.state.currentActionUid,
      Context.interfaceState.state.selectedActionChoiceUid
    );
    const isSelected = feature.values_.id === choiceDescriptor?.placeholder;
    strokeStyle.color =
      getInterfaceColor(Context.interfaceState.state.currentActorUid) + (isSelected ? 'ff' : '50');
  }

  return { stroke: strokeStyle };
}

function getPolygonStyle(feature: any): LayerStyleObject {
  // Unused but all availables properties, can be freely extended in activablesLayer
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

  const text: TextStyleObject = {
    type: 'TextStyle',
    // If we are in a selection state we use alphabetical index, otherwise we apply the name
    text: Context.mapState.state.mapSelect
      ? getLetterRepresentationOfIndex(parseInt(index, 10))
      : label || 'No name',
    font: 'bold 10px sans-serif',
    textAlign: 'center',
    scale: 1.6,
    fill: {
      type: 'FillStyle',
      color: 'white',
    },
  };

  // Selection
  if (Context.mapState.state.mapSelect) {
    const choiceDescriptor = getChoiceDescriptor(
      Context.interfaceState.state.currentActionUid,
      Context.interfaceState.state.selectedActionChoiceUid
    );
    const isSelected = feature.values_.id === choiceDescriptor?.placeholder;
    stroke.color =
      getInterfaceColor(Context.interfaceState.state.currentActorUid) + (isSelected ? 'ff' : '50');
    fill.color =
      getInterfaceColor(Context.interfaceState.state.currentActorUid) + (isSelected ? 'ff' : '50');
  }

  return { fill, stroke, text };
}
