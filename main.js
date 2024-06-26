import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { fromLonLat } from 'ol/proj.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import { GeoJSON } from 'ol/format.js';
import { Style, Circle as CircleStyle, Fill, Stroke, RegularShape, Text } from 'ol/style.js';
import { Select, defaults as defaultInteractions, Draw, Modify } from 'ol/interaction.js';
import { pointerMove, click, platformModifierKeyOnly } from 'ol/events/condition.js';
import { Overlay } from 'ol';
import DragBox from 'ol/interaction/DragBox.js';
import { getWidth } from 'ol/extent.js';
import { LineString, Point } from 'ol/geom.js';
import { getArea, getLength } from 'ol/sphere.js';







// url을 변수로 빼서 따로 설정해 줘도 됨
const g_url = "http://localhost:42888";

let wfsSource = null;
let wfsLayer = null;

// 목록 클릭 시 CQL 필터 만드는 함수 추가 
function makeFilter(method) {
  let filter = "";

  // 읍면 지역 필터
  if ('ym01' == method)
    filter = "jinju_do_1 LIKE '%문산읍%'";

  else if ('ym02' == method)
    filter = "jinju_do_1 LIKE '%내동면%'";

  else if ('ym03' == method)
    filter = "jinju_do_1 LIKE '%정촌면%'";

  else if ('ym04' == method)
    filter = "jinju_do_1 LIKE '%금곡면%'";

  else if ('ym05' == method)
    filter = "jinju_do_1 LIKE '%진성면%'";

  else if ('ym06' == method)
    filter = "jinju_do_1 LIKE '%일반성면%'";

  else if ('ym07' == method)
    filter = "jinju_do_1 LIKE '%이반성면%'";

  else if ('ym08' == method)
    filter = "jinju_do_1 LIKE '%사봉면%'";

  else if ('ym09' == method)
    filter = "jinju_do_1 LIKE '%지수면%'";

  else if ('ym10' == method)
    filter = "jinju_do_1 LIKE '%대곡면%'";

  else if ('ym11' == method)
    filter = "jinju_do_1 LIKE '%금산면%'";

  else if ('ym12' == method)
    filter = "jinju_do_1 LIKE '%집현면%'";

  else if ('ym13' == method)
    filter = "jinju_do_1 LIKE '%미천면%'";

  else if ('ym14' == method)
    filter = "jinju_do_1 LIKE '%명석면%'";

  else if ('ym15' == method)
    filter = "jinju_do_1 LIKE '%대평면%'";

  else if ('ym16' == method)
    filter = "jinju_do_1 LIKE '%수곡면%'";

  // 동지역 필터
  else if ('dong1' == method)
    filter = "jinju_do_1 LIKE '%귀곡동%' OR jinju_do_1 LIKE '%판문동%'";

  else if ('dong2' == method)
    filter = "jinju_do_1 LIKE '%이현동%' OR jinju_do_1 LIKE '%유곡동%' OR jinju_do_1 LIKE '%상봉동%'";

  else if ('dong3' == method)
    filter = "jinju_do_1 LIKE '%하촌동%' OR jinju_do_1 LIKE '%장재동%' OR jinju_do_1 LIKE '%봉래동%'";

  else if ('dong4' == method)
    filter = "jinju_do_1 LIKE '%평거동%' OR jinju_do_1 LIKE '%신안동%'";

  else if ('dong5' == method)
    filter = "jinju_do_1 LIKE '%봉곡동%' OR jinju_do_1 LIKE '%인사동%' OR jinju_do_1 LIKE '%주약동%'";

  else if ('dong6' == method)
    filter = "jinju_do_1 LIKE '%계동%' OR jinju_do_1 LIKE '%중안동%' OR jinju_do_1 LIKE '%본성동%'";

  else if ('dong7' == method)
    filter = "jinju_do_1 LIKE '%평안동%' OR jinju_do_1 LIKE '%대안동%' OR jinju_do_1 LIKE '%동성동%'";

  else if ('dong8' == method)
    filter = "jinju_do_1 LIKE '%수정동%' OR jinju_do_1 LIKE '%장대동%' OR jinju_do_1 LIKE '%옥봉동%'";

  else if ('dong9' == method)
    filter = "jinju_do_1 LIKE '%초전동%' OR jinju_do_1 LIKE '%하대동%'";

  else if ('dong10' == method)
    filter = "jinju_do_1 LIKE '%망경동%' OR jinju_do_1 LIKE '%강남동%' OR jinju_do_1 LIKE '%칠암동%'";

  else if ('dong11' == method)
    filter = "jinju_do_1 LIKE '%상대동%' OR jinju_do_1 LIKE '%상평동%'";

  else if ('dong12' == method)
    filter = "jinju_do_1 LIKE '%남성동%' OR jinju_do_1 LIKE '%가좌동%'";

  else if ('dong13' == method)
    filter = "jinju_do_1 LIKE '%호탄동%' OR jinju_do_1 LIKE '%충무공동%'";

  return filter;
}

// 나중에 조건에 따라 스타일을 다르게 주기 위해 스타일 개별 지정
const defaultStyle = new Style({
  fill: new Fill({
    color: 'rgba(75, 240, 26, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

// 0~30 스타일
const Style0030 = new Style({
  fill: new Fill({
    color: 'rgba(251, 199, 28, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

// 31~60 스타일
const Style3160 = new Style({
  fill: new Fill({
    color: 'rgba(251, 121, 28, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

// 61~100 스타일
const Style6100 = new Style({
  fill: new Fill({
    color: 'rgba(251, 28, 28, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});




// Vector 레이어 생성
const vectorLayer = new VectorLayer({
  source: wfsSource,
  style: defaultStyle,
});

let newWfsSource;

function makeWFSSource(method) {
  newWfsSource = new VectorSource
    (
      {
        format: new GeoJSON(),
        url: encodeURI(g_url + "/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature" +
        "&typeName=jinjuWS:jj&maxFeatures=2000&outputFormat=application/json&CQL_FILTER=" + makeFilter(method))
      }
    );
  vectorLayer.setSource(newWfsSource)
}

  makeWFSSource("");


wfsLayer = new VectorLayer({
  source: wfsSource,
});


// osm(오픈 소스 기반 지도 서비스) 레이어를 만든다.
const osmLayer = new TileLayer
(
  {
    source: new OSM()
  }
);


const map = new Map({
  target: 'map',
  layers: [osmLayer, vectorLayer,],
  // overlays: [overlay],
  view: new View({
    center: [14261274,4187593],
    zoom: 11.5,
    // constrainRotation: 16,
    // interactions: defaults().extend([mouseHoverSelect])
    
  })
});








// 거리 및 면적 계산 기능

const showSegments = document.getElementById('segments');
const clearPrevious = document.getElementById('clear');

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
  text: new Text({
    text: '종료점',
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textBaseline: 'bottom',
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
});

const segmentStyles = [segmentStyle];

const formatLength = function (line) {
  const length = getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' km';
  } else {
    output = Math.round(length * 100) / 100 + ' m';
  }
  return output;
};

const formatArea = function (polygon) {
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
  } else {
    output = Math.round(area * 100) / 100 + ' m\xB2';
  }
  return output;
};

const source = new VectorSource();

const modify = new Modify({ source: source, style: modifyStyle });

let tipPoint;

function styleFunction(feature, segments, drawType, tip) {
  const styles = [];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type || type === 'Point') {
    styles.push(style);
    if (type === 'Polygon') {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === 'LineString') {
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === 'Point' &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

const vector = new VectorLayer({
  source: source,
  style: function (feature) {
    return styleFunction(feature, showSegments.checked);
  },
});

map.addLayer(vector);
map.addInteraction(modify);

let draw; // global so we can remove it later

function addInteraction(drawType) {
  const activeTip = '다음점' + (drawType === 'Polygon' ? 'polygon' : '(종료시 더블클릭)');
  const idleTip = '시작점';
  let tip = idleTip;
  draw = new Draw({
    source: source,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  draw.on('drawstart', function () {
    if (clearPrevious.checked) {
      source.clear();
    }
    modify.setActive(false);
    tip = activeTip;
   
  });
  draw.on('drawend', function (event) {
    event.feature.set('keep', true); 
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once('pointermove', function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(draw);
}



function setDrawType(type) {
  if (draw) {
    map.removeInteraction(draw);
    draw = null;
  }
  addInteraction(type);
}

document.getElementById('distanceButton').addEventListener('click', function () {
  setDrawType('LineString');
});

document.getElementById('areaButton').addEventListener('click', function () {
  setDrawType('Polygon');
});

showSegments.addEventListener('change', function () {
  vector.changed();
  if (draw) {
    draw.getOverlay().changed();
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    if (draw) {
      map.removeInteraction(draw);
      draw = null;
    }
  }
});

clearPrevious.addEventListener('change', function () {
  if (clearPrevious.checked) {
    source.clear();
  }
});





// 읍면 사이드바 클릭 시 이벤트 발생
document.getElementById('ym01').onclick = () => {
  // console.log('ym01 clicked');
  makeWFSSource('ym01');
}

document.getElementById('ym02').onclick = () => {
  makeWFSSource('ym02');
}

document.getElementById('ym03').onclick = () => {
  makeWFSSource('ym03');
}

document.getElementById('ym04').onclick = () => {
  makeWFSSource('ym04');
}

document.getElementById('ym05').onclick = () => {
  makeWFSSource('ym05');
}

document.getElementById('ym06').onclick = () => {
  makeWFSSource('ym06');
}

document.getElementById('ym07').onclick = () => {
  makeWFSSource('ym07');
}

document.getElementById('ym08').onclick = () => {
  makeWFSSource('ym08');
}

document.getElementById('ym09').onclick = () => {
  makeWFSSource('ym09');
}

document.getElementById('ym10').onclick = () => {
  makeWFSSource('ym10');
}

document.getElementById('ym11').onclick = () => {
  makeWFSSource('ym11');
}

document.getElementById('ym12').onclick = () => {
  makeWFSSource('ym12');
}

document.getElementById('ym13').onclick = () => {
  makeWFSSource('ym13');
}

document.getElementById('ym14').onclick = () => {
  makeWFSSource('ym14');
}

document.getElementById('ym15').onclick = () => {
  makeWFSSource('ym15');
}

document.getElementById('ym16').onclick = () => {
  makeWFSSource('ym16');
}

// 동 사이드바 클릭 시 이벤트 발생
document.getElementById('dong1').onclick = () => {
  // console.log('dong1 clicked');
  makeWFSSource('dong1');
}

document.getElementById('dong2').onclick = () => {
  makeWFSSource('dong2');
}

document.getElementById('dong3').onclick = () => {
  makeWFSSource('dong3');
}

document.getElementById('dong4').onclick = () => {
  makeWFSSource('dong4');
}

document.getElementById('dong5').onclick = () => {
  makeWFSSource('dong5');
}

document.getElementById('dong6').onclick = () => {
  makeWFSSource('dong6');
}

document.getElementById('dong7').onclick = () => {
  makeWFSSource('dong7');
}

document.getElementById('dong8').onclick = () => {
  makeWFSSource('dong8');
}

document.getElementById('dong9').onclick = () => {
  makeWFSSource('dong9');
}

document.getElementById('dong10').onclick = () => {
  makeWFSSource('dong10');
}

document.getElementById('dong11').onclick = () => {
  makeWFSSource('dong11');
}

document.getElementById('dong12').onclick = () => {
  makeWFSSource('dong12');
}

document.getElementById('dong13').onclick = () => {
  makeWFSSource('dong13');
}