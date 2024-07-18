interface RoadParams {
  color: string;
  size: number;
  noStyle: boolean;
}

function getRoadParams(feature: any, resolution: number): RoadParams {
  let hw = feature.getProperties().highway;
  if (hw) {
    hw = hw.split('_')[0];
  }
  hw = hw || 'primary';

  let noStyle = false;
  let color = '#FFF'; // default
  let size = 1;

  switch (hw) {
    case 'motorway':
    case 'trunk':
    case 'primary':
    case 'secondary':
    case 'tertiary':
    case 'unclassified':
    case 'residential':
    case 'living':
      size = 8;
      break;
    case 'pedestrian':
    case 'footway':
    case 'service':
    case 'path':
    case 'cycleway':
    case 'steps':
    case 'platform':
      noStyle = true;
      break;
    case 'proposed':
    case 'construction':
      size = 5;
      break;
    default:
      color = '#D9DDE1';
      break;
  }

  return { color: color, size: size / resolution, noStyle: noStyle };
}

export function getRoadStyle(feature: any, resolution: number): LayerStyleObject[] {
  const { color, size, noStyle } = getRoadParams(feature, resolution);
  if (noStyle) return [];
  const style: LayerStyleObject[] = [
    {
      stroke: {
        type: 'StrokeStyle',
        lineCap: 'butt',
        lineJoin: 'round',
        miterLimit: 10,
        width: size,
        color: color,
      },
    },
  ];
  const name = feature.getProperties().name;
  if (name) {
    style.push({
      text: {
        type: 'TextStyle',
        fill: { type: 'FillStyle', color: 'black' },
        stroke: {
          type: 'StrokeStyle',
          lineCap: 'round',
          lineJoin: 'round',
          miterLimit: 10,
          width: 2,
          color: '#FFF', //border for the road's name
        },
        text: name,
        scale: 1.6,
        placement: 'line',
        overflow: false,
      },
    });
  }
  return style;
}

export function getRailwayStyle(resolution: number): LayerStyleObject[] {
  const dashSize = 8 / resolution;
  const styleDark: LayerStyleObject = {
    stroke: {
      type: 'StrokeStyle',
      lineCap: 'butt',
      lineJoin: 'round',
      miterLimit: 10,
      width: 2.3 / resolution,
      color: 'black',
    },
  };
  const styleLight: LayerStyleObject = {
    stroke: {
      type: 'StrokeStyle',
      lineCap: 'butt',
      lineJoin: 'round',
      miterLimit: 10,
      width: 2 / resolution,
      color: 'white',
      lineDash: [dashSize],
      lineDashOffset: dashSize,
    },
  };
  return [styleDark, styleLight];
}

export function getWaterStyle(feature: any, _resolution: number): LayerStyleObject {
  const label = feature.getProperties().name;
  const style: LayerStyleObject = {};

  if (label) {
    style.text = {
      type: 'TextStyle',
      fill: { type: 'FillStyle', color: 'lightskyblue' },
      stroke: {
        type: 'StrokeStyle',
        lineCap: 'round',
        lineJoin: 'round',
        miterLimit: 10,
        width: 2,
      },
      overflow: true,
      placement: 'line',
      scale: 1.5,
      text: label,
    };
  }

  style.stroke = {
    type: 'StrokeStyle',
    lineCap: 'round',
    lineJoin: 'round',
    miterLimit: 10,
    color: 'rgb(80,150,200)',
  };
  style.fill = { type: 'FillStyle', color: 'rgba(80,150,200,0.5)' };
  return style;
}
