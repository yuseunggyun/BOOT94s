// OpenLayers > Examples > WFS
// GeoServer에 있는 진주 연속지적도를 벡터파일로 서비스 후 꾸미기

import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

// geoserver에서 WFS 방식으로 가져오기 위해
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import { GeoJSON } from 'ol/format';
import { Style } from 'ol/style';
import { Circle } from 'ol/style';
import { Stroke } from 'ol/style';
import { Fill } from 'ol/style';

// view와의 상호작용을 위해 
import { Select, defaults } from 'ol/interaction';
import { pointerMove, click, platformModifierKeyOnly } from 'ol/events/condition';

// 팝업창을 위해
import { Overlay } from 'ol';

// dragbox를 위해
import DragBox from 'ol/interaction/DragBox';
import { getWidth } from 'ol/extent.js';

//지도상 거리 면적 계산기능을 위해
import {
  Circle as CircleStyle,
  RegularShape,
  Text,
} from 'ol/style.js';
import { Draw, Modify } from 'ol/interaction.js';
import { LineString, Point } from 'ol/geom.js';
import { getArea, getLength } from 'ol/sphere.js';


// 위성지도를 가져오기 위해
import 'ol/ol.css';
import XYZ from 'ol/source/XYZ';

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

  vectorLayer.setSource(newWfsSource);
}

makeWFSSource("");

wfsLayer = new VectorLayer({
  source: wfsSource,
});

// popup 창 설정
const popup = document.getElementById('popup');

const overlay = new Overlay({
  element: popup,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

// Mouse Hover 스타일
const mouseHoverSelect = new Select({
  condition: pointerMove,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(79, 252, 211, 0.5)'
    })
  })
});

// OSM 지도를 osmLayer 변수에 담기
const osmLayer = new TileLayer({
  source: new OSM()
});

// 지도 생성
const map = new Map({
  layers: [
    osmLayer,   // 배경 지도
    //위성지도 가져옴
    new TileLayer({
      source: new OSM(),
      visible: true,
      title: 'RoadMap'
    }),
    new TileLayer({
      source: new XYZ({
        url: 'http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      }),
      visible: false,
      title: 'SatelliteMap'
    }),
    vectorLayer // 백터 레이어
  ],
  target: 'map',
  overlays: [overlay],
  view: new View({
    center: fromLonLat([128.1298, 35.2052]),
    zoom: 10,
    constrainRotation: 16,
    interactions: defaults().extend([mouseHoverSelect])
  }),
});




// 위성지도부분
const roadLayer = map.getLayers().getArray().find(layer => layer.get('title') === 'RoadMap');
const satelliteLayer = map.getLayers().getArray().find(layer => layer.get('title') === 'SatelliteMap');

document.getElementById('btn-road').addEventListener('click', function () {
  roadLayer.setVisible(true);
  satelliteLayer.setVisible(false);
});

document.getElementById('btn-satellite').addEventListener('click', function () {
  roadLayer.setVisible(false);
  satelliteLayer.setVisible(true);
});






// 거리 및 면적 계산 기능

const showSegments = document.getElementById('segments');
const clearPrevious = document.getElementById('clear');

const lineStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 0, 0, 0.8)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new Circle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(255, 0, 0, 0.8)',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.3)',
    }),
  }),
});

const labelTextStyle = new Style({
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 0, 0, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundStroke: new Stroke({
      color: 'rgba(255, 0, 0, 0.8)', // 빨간색 테두리
      width: 1, // 테두리 굵기
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
      color: 'rgba(255, 0, 0, 0.8)',
    }),
  }),
});

const tooltipTextStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 0, 0, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const modifyPointStyle = new Style({
  image: new Circle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(255, 0, 0, 0.7)',
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.3)',
    }),
  }),
  text: new Text({
    text: '종료점',
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 0, 0, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const segmentTextStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 0, 0, 1)',
    }),
    backgroundFill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
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
      color: 'rgba(255, 0, 0, 0.8)',
    }),
  }),
});

const segmentStyles = [segmentTextStyle];

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

const modify = new Modify({ source: source, style: modifyPointStyle });

let tipPoint;

function styleFunction(feature, segments, drawType, tip) {
  const styles = [];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type || type === 'Point') {
    styles.push(lineStyle);
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
        segmentStyles.push(segmentTextStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelTextStyle.setGeometry(point);
    labelTextStyle.getText().setText(label);
    styles.push(labelTextStyle);
  }
  if (
    tip &&
    type === 'Point' &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tooltipTextStyle.getText().setText(tip);
    styles.push(tooltipTextStyle);
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
  //호버 비활성화
  map.removeInteraction(mouseHoverSelect);
  // 선택 기능 비활성화
  map.removeInteraction(select);
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
    modifyPointStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once('pointermove', function () {
      modifyPointStyle.setGeometry();
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
  //호버 활성화
  map.addInteraction(mouseHoverSelect);
  // 선택 기능 활성화
  map.addInteraction(select);
});

clearPrevious.addEventListener('change', function () {
  if (clearPrevious.checked) {
    source.clear();
  }
});













// Mouse Hover 활성화
map.addInteraction(mouseHoverSelect);

const selectedStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 3,
  }),
});

// Select 도구
const select = new Select({
  style: function (feature) {
    const color = feature.get('COLOR_BIO') || 'rgba(108, 169, 131, 0.5';
    selectedStyle.getFill().setColor(color);
    return selectedStyle;
  },
});

// Select 활성화
map.addInteraction(select);

// Select 피처 값 가져오기
const selectedFeatures = select.getFeatures();

// JQuery를 이용하여 HTML 입력 값(SUM) 가져옴
function calculateSum() {
  var sub1 = parseFloat($('#sub1').val());
  var sub2 = parseFloat($('#sub2').val());
  var sub3 = parseFloat($('#sub3').val());

  var sum = sub1 + sub2 + sub3;

  $('#result').text('총합: ' + sum);

  // Select 객체를 조건에 따라 다른 색상을 줌
  selectedFeatures.forEach(function (feature) {
    if (sum < 30) {
      feature.setStyle(Style0030);
    } else if (sum > 30 && sum < 60) {
      feature.setStyle(Style3160);
    } else {
      feature.setStyle(Style6100);
    }
  });
}

// 보조키(Ctrl)를 사용한 DragBox 기능
const dragBox = new DragBox({
  condition: platformModifierKeyOnly,
});

// DragBox 활성화
map.addInteraction(dragBox);

// Drag하여 Select한 객체를 조건에 따라 다른 색상을 줌
dragBox.on('boxend', function () {
  selectedFeatures.forEach(function (feature) {
    if (sum < 30) {
      feature.setStyle(Style0030);
    } else if (sum > 30 && sum < 60) {
      feature.setStyle(Style3160);
    } else {
      feature.setStyle(Style6100);
    }
  });

  // DragBox 부분은 geoserver에서 제공하는 문서를 보고 참고함.
  const boxExtent = dragBox.getGeometry().getExtent();

  // if the extent crosses the antimeridian process each world separately
  const worldExtent = map.getView().getProjection().getExtent();
  const worldWidth = getWidth(worldExtent);
  const startWorld = Math.floor((boxExtent[0] - worldExtent[0]) / worldWidth);
  const endWorld = Math.floor((boxExtent[2] - worldExtent[0]) / worldWidth);

  for (let world = startWorld; world <= endWorld; ++world) {
    const left = Math.max(boxExtent[0] - world * worldWidth, worldExtent[0]);
    const right = Math.min(boxExtent[2] - world * worldWidth, worldExtent[2]);
    const extent = [left, boxExtent[1], right, boxExtent[3]];

    const boxFeatures = newWfsSource
      .getFeaturesInExtent(extent)
      .filter(
        (feature) =>
          !selectedFeatures.getArray().includes(feature) &&
          feature.getGeometry().intersectsExtent(extent),
      );

    const rotation = map.getView().getRotation();
    const oblique = rotation % (Math.PI / 2) !== 0;

    if (oblique) {
      const anchor = [0, 0];
      const geometry = dragBox.getGeometry().clone();
      geometry.translate(-world * worldWidth, 0);
      geometry.rotate(-rotation, anchor);
      const extent = geometry.getExtent();
      boxFeatures.forEach(function (feature) {
        const geometry = feature.getGeometry().clone();
        geometry.rotate(-rotation, anchor);
        if (geometry.intersectsExtent(extent)) {
          selectedFeatures.push(feature);
        }
      });
    } else {
      selectedFeatures.extend(boxFeatures);
    }
  }
});

// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function () {
  selectedFeatures.clear();
});

const infoBox = document.getElementById('info');

selectedFeatures.on(['add', 'remove'], function () {
  const names = selectedFeatures.getArray().map((feature) => {
    return feature.get('ECO_NAME');
  });
  if (names.length > 0) {
    infoBox.innerHTML = names.join(', ');
  } else {
    infoBox.innerHTML = 'None';
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

// 지도 클릭 이벤트. 오버레이를 처리
map.on('click', (e) => {
  console.log(e);

  // 일단 창을 닫음. 이렇게 하면 자료가 없는 곳을 찍으면 창이 닫히는 효과가 나옴
  // overlay.setPosition(undefined);

  // 점찍은 곳의 자료를 찾아냄. geoserver에서는 WFS를 위해 위치 정보 뿐 아니라 메타데이터도 같이 보내고 있음
  map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
    // 점찍은 곳에 넘어온 메타데이터 값을 찾음
    let clickedFeatureID = feature.get('id');
    let clickedFeaturejinju_do_1 = feature.get('jinju_do_1');
    let clickedFeaturejinju_jibu = feature.get('jinju_jibu');

    // 메타데이터를 오버레이 하기 위한 div에 적음
    document.getElementById("info-title").innerHTML = "[" + clickedFeaturejinju_do_1 + " " + clickedFeaturejinju_jibu + "]"
    document.getElementById("jinju_link").href = "./detail.jsp?id=" + clickedFeatureID;

    // 오버레이 창을 띄움
    // overlay.setPosition(e.coordinate);

    // JQUERY를 이용한 area1 창에 정보 표시
    $(document).ready(function () {
      var clickedFeature1 = feature.get('pnu');
      $('#pnu').text(clickedFeature1);
      $('#pnu').attr('data-clicked-feature-pnu', clickedFeature1);
    })

    $(document).ready(function () {
      var clickedFeature2 = feature.get('jinju_do_1');
      $('#do').text(clickedFeature2);
      $('#do').attr('data-clicked-feature-jinju_do_1', clickedFeature2);
    })

    $(document).ready(function () {
      var clickedFeature3 = feature.get('jinju_cada');
      $('#cada').text(clickedFeature3);
      $('#cada').attr('data-clicked-feature-jinju_cada', clickedFeature3);
    })

    $(document).ready(function () {
      var clickedFeature4 = feature.get('jinju_jibu');
      $('#jibun').text(clickedFeature4);
      $('#jibun').attr('data-clicked-feature-jinju_jibu', clickedFeature4);
    })

    $(document).ready(function () {
      var clickedFeature5 = feature.get('jinju_ji_1');
      $('#jimok').text(clickedFeature5);
      $('#jimok').attr('data-clicked-feature-jinju_ji_1', clickedFeature5);
    })

    $(document).ready(function () {
      var clickedFeature6 = feature.get('jinju_area');
      $('#are').text(clickedFeature6);
      $('#are').attr('data-clicked-feature-jinju_area', clickedFeature6);
    })

    $(document).ready(function () {
      var clickedFeature7 = feature.get('jinju_pric');
      $('#price').text(clickedFeature7);
      $('#price').attr('data-clicked-feature-jinju_pric', clickedFeature7);
    })

    $(document).ready(function () {
      var clickedFeature8 = feature.get('jinju_ow_1');
      $('#owner').text(clickedFeature8);
      $('#owner').attr('data-clicked-feature-jinju_ow_1', clickedFeature8);
    })

    $(document).ready(function () {
      var clickedFeature9 = feature.get('jinju_ch_1');
      $('#owner_re').text(clickedFeature9);
      $('#owner_re').attr('data-clicked-feature-jinju_ch_1', clickedFeature9);
    })

    $(document).ready(function () {
      var clickedFeature10 = feature.get('jinju_ch_2');
      $('#owner_da').text(clickedFeature10);
      $('#owner_da').attr('data-clicked-feature-jinju_ch_2', clickedFeature10);
    })

    $(document).ready(function () {
      $('#inputForm').on('submit', function (event) {
        event.preventDefault();
        calculateSum();
      });
    });
  });
});