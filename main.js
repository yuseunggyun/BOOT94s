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
import { Style, Stroke, Fill } from 'ol/style';

// view와의 상호작용을 위해 
import { Select, defaults } from 'ol/interaction';
import { pointerMove, platformModifierKeyOnly } from 'ol/events/condition';

// dragbox를 위해
import DragBox from 'ol/interaction/DragBox';
import { getWidth } from 'ol/extent.js';

// 지도상 거리 면적 계산기능을 위해
import { Circle, RegularShape, Text } from 'ol/style.js';
import { Draw, Modify } from 'ol/interaction.js';
import { LineString, Point } from 'ol/geom.js';
import { getArea, getLength } from 'ol/sphere.js';

// 위성지도를 가져오기 위해
import 'ol/ol.css';
import XYZ from 'ol/source/XYZ';

// url을 변수로 빼서 따로 설정해 줘도 됨
// const g_url = "http://localhost:42888";// 내부용
const g_url = "http://172.20.221.180:42888";// 외부용

let wfsSource = null;

// 목록 클릭 시 CQL 필터 만드는 함수 추가 
function makeFilter(method) {
  const filters = {
    // 읍면 지역 필터
    'ym01': "jinju_do_1 LIKE '%문산읍%'",
    'ym02': "jinju_do_1 LIKE '%내동면%'",
    'ym03': "jinju_do_1 LIKE '%정촌면%'",
    'ym04': "jinju_do_1 LIKE '%금곡면%'",
    'ym05': "jinju_do_1 LIKE '%진성면%'",
    'ym06': "jinju_do_1 LIKE '%일반성면%'",
    'ym07': "jinju_do_1 LIKE '%이반성면%'",
    'ym08': "jinju_do_1 LIKE '%사봉면%'",
    'ym09': "jinju_do_1 LIKE '%지수면%'",
    'ym10': "jinju_do_1 LIKE '%대곡면%'",
    'ym11': "jinju_do_1 LIKE '%금산면%'",
    'ym12': "jinju_do_1 LIKE '%집현면%'",
    'ym13': "jinju_do_1 LIKE '%미천면%'",
    'ym14': "jinju_do_1 LIKE '%명석면%'",
    'ym15': "jinju_do_1 LIKE '%대평면%'",
    'ym16': "jinju_do_1 LIKE '%수곡면%'",
    // 동 지역 필터
    'dong1': "jinju_do_1 LIKE '%귀곡동%' OR jinju_do_1 LIKE '%판문동%'",
    'dong2': "jinju_do_1 LIKE '%이현동%' OR jinju_do_1 LIKE '%유곡동%' OR jinju_do_1 LIKE '%상봉동%'",
    'dong3': "jinju_do_1 LIKE '%하촌동%' OR jinju_do_1 LIKE '%장재동%' OR jinju_do_1 LIKE '%봉래동%'",
    'dong4': "jinju_do_1 LIKE '%평거동%' OR jinju_do_1 LIKE '%신안동%'",
    'dong5': "jinju_do_1 LIKE '%봉곡동%' OR jinju_do_1 LIKE '%인사동%' OR jinju_do_1 LIKE '%주약동%'",
    'dong6': "jinju_do_1 LIKE '%계동%' OR jinju_do_1 LIKE '%중안동%' OR jinju_do_1 LIKE '%본성동%'",
    'dong7': "jinju_do_1 LIKE '%평안동%' OR jinju_do_1 LIKE '%대안동%' OR jinju_do_1 LIKE '%동성동%'",
    'dong8': "jinju_do_1 LIKE '%수정동%' OR jinju_do_1 LIKE '%장대동%' OR jinju_do_1 LIKE '%옥봉동%'",
    'dong9': "jinju_do_1 LIKE '%초전동%' OR jinju_do_1 LIKE '%하대동%'",
    'dong10': "jinju_do_1 LIKE '%망경동%' OR jinju_do_1 LIKE '%강남동%' OR jinju_do_1 LIKE '%칠암동%'",
    'dong11': "jinju_do_1 LIKE '%상대동%' OR jinju_do_1 LIKE '%상평동%'",
    'dong12': "jinju_do_1 LIKE '%남성동%' OR jinju_do_1 LIKE '%가좌동%'",
    'dong13': "jinju_do_1 LIKE '%호탄동%' OR jinju_do_1 LIKE '%충무공동%'"
  };
  return filters[method] || "";
}

// 나중에 조건에 따라 스타일을 다르게 주기 위해 스타일 개별 지정
// 기본 스타일
const defaultStyle = new Style({
  fill: new Fill({ color: 'rgba(255, 51, 255, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(36, 24, 35, 0.8)', width: 1.2})
});


// 0~20 값 스타일
const Style0020 = new Style({
  fill: new Fill({ color: 'rgba(0, 102, 0, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

//21~40 값 스타일
const Style2140 = new Style({
  fill: new Fill({ color: 'rgba(102, 153, 0, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

//41~60 값 스타일
const Style4160 = new Style({
  fill: new Fill({ color: 'rgba(255, 255, 0, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

//61~80 값 스타일
const Style6180 = new Style({
  fill: new Fill({ color: 'rgba(255, 153, 0, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

//81~100 값 스타일
const Style8100 = new Style({
  fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

// 종합적성값에 따른 스타일 반환 함수
function getStyleByTotalSum(totalsum) {
  if (totalsum == null) {
    return defaultStyle;
  }

  if (totalsum <= 20) {
    return Style0020;
  } else if (totalsum > 20 && totalsum <= 40) {
    return Style2140;
  } else if (totalsum > 40 && totalsum <= 60) {
    return Style4160;
  } else if (totalsum > 60 && totalsum <= 80) {
    return Style6180;
  } else if (totalsum > 80 && totalsum <= 100) {
    return Style8100;
  } else {
    return defaultStyle;
  }
}

// 벡터 레이어를 위한 커스텀 스타일 함수
function vectorLayerStyleFunction(feature) {
  const totalsum = feature.get('sub15');
  // console.log("Vector layer feature totalsum:", totalsum);
  return getStyleByTotalSum(totalsum) || defaultStyle;
}

// 폴리곤 레이어를 위한 커스텀 스타일 함수
function polygonLayerStyleFunction(feature) {
  const totalsum = feature.get('sub15');
  // console.log("Polygon layer feature totalsum:", totalsum);
  return getStyleByTotalSum(totalsum) || defaultStyle;
}

// 생성 폴리곤 레이어를 위한 커스텀 스타일 함수
function polygonLayer1StyleFunction(feature) {
  const totalsum = feature.get('sub15');
  // console.log("Polygon layer feature totalsum:", totalsum);
  return getStyleByTotalSum(totalsum) || defaultStyle;
}

// 커스텀 스타일 함수로 벡터 레이어 생성
const vectorLayer = new VectorLayer({
  source: wfsSource,
  style: vectorLayerStyleFunction
});

// Geoserver에서 "진주" 벡터 레이어 가져오기
let newWfsSource;
function makeWFSSource(method) {
  newWfsSource = new VectorSource({
    format: new GeoJSON(),
    url: encodeURI(`${g_url}/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:jj&maxFeatures=1000&outputFormat=application/json&CQL_FILTER=${makeFilter(method)}`)
  });

  vectorLayer.setSource(newWfsSource);
}

// 폴리곤 레이어(make) 소스 정의
const polygonSource = new VectorSource();
const polygonLayer = new VectorLayer({
  source: polygonSource,
    style: polygonLayerStyleFunction    
});

// 폴리곤 생성 소스 및 레이어 정의
const polygonSource1 = new VectorSource();
const polygonLayer1 = new VectorLayer({
  source: polygonSource1,
    style: polygonLayer1StyleFunction 
});

// geoserver에서 "폴리곤" 벡터 레이어 가져오기
function makePolygonWFSSource() {
  const polyWfsSource = new VectorSource({
    format: new GeoJSON(),
    url: encodeURI(`${g_url}/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:make&outputFormat=application/json`)
  });
  polygonLayer.setSource(polyWfsSource);
}

makeWFSSource(""); // 초기 로드 시 필터 없는 기존 레이어 로드
makePolygonWFSSource(); // 초기 로드 시 필터 없는 폴리곤 레이어 로드

// Mouse Hover 스타일
const mouseHoverSelect = new Select({
  condition: pointerMove,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 184, 255, 1)',
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(47, 81, 109, 0.7)'
    })
  })
});

// OSM 레이어 생성
const osmLayer = new TileLayer({
  source: new OSM()
});

// 지도 생성
const map = new Map({
  layers: [
    osmLayer,   // 배경 지도
    // 위성 지도
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
    vectorLayer, // "진주" 레이어
    polygonLayer, // "폴리곤" 레이어
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([128.1298, 35.2052]),
    zoom: 12,
    interactions: defaults().extend([mouseHoverSelect])
  })
});

/* 위성 지도 레이어 */
const roadLayer = map.getLayers().getArray().find(layer => layer.get('title') === 'RoadMap');
const satelliteLayer = map.getLayers().getArray().find(layer => layer.get('title') === 'SatelliteMap');

// 일반 지도 버튼 클릭 이벤트
document.getElementById('btn-road').addEventListener('click', function () {
  roadLayer.setVisible(true);
  satelliteLayer.setVisible(false);
});
// 위성 지도 버튼 클릭 이벤트
document.getElementById('btn-satellite').addEventListener('click', function () {
  roadLayer.setVisible(false);
  satelliteLayer.setVisible(true);
});

/* 거리 및 면적 계산 기능 (Geoserver에서 참고함) */
const showSegments = document.getElementById('segments');
const clearPrevious = document.getElementById('clear');

// 선 스타일 정의 
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

// 라벨 텍스트 스타일 정의
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

// 툴팁 텍스트 스타일 정의
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

// 수정 포인트 스타일 정의
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

// 세그먼트(나뉜 부분) 텍스트 스타일 정의
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

// 세그먼트 스타일 배열 초기화
const segmentStyles = [segmentTextStyle];
// 선의 길이를 형식화
const formatLength = function (line) {
  const length = getLength(line); // 선의 길이 계산
  let output;
  if (length > 100) {
    // 길이가 100m 보다 길면 km 단위로 변환
    output = Math.round((length / 1000) * 100) / 100 + ' km';
  } else {
    // 그렇지 않으면 m 단위로 표시
    output = Math.round(length * 100) / 100 + ' m';
  }
  return output;
};

// 면적을 형식화
const formatArea = function (polygon) {
  const area = getArea(polygon); // 면적을 계산
  let output;
  if (area > 10000) {
    // 면적이 10000m²보다 크면 km² 단위로 변환
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
  } else {
    // 그렇지 않으면 m² 단위로 표시
    output = Math.round(area * 100) / 100 + ' m\xB2';
  }
  return output;
};

// 새로운 벡터 소스 생성
const Dsource = new VectorSource();
// 수정 인터랙션 생성
const modify = new Modify({ source: Dsource, style: modifyPointStyle });
let tipPoint;
// 스타일 함수 정의
function styleFunction(feature, segments, drawType, tip) {
  const styles = [];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type || type === 'Point') {
    // 기본 스타일 추가
    styles.push(lineStyle);
    if (type === 'Polygon') {
      // 폴리곤의 경우
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === 'LineString') {
      // 라인스트링의 경우
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    // 세그먼트 스타일 추가
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
    // 라벨 스타일 추가
    labelTextStyle.setGeometry(point);
    labelTextStyle.getText().setText(label);
    styles.push(labelTextStyle);
  }
  if (
    tip &&
    type === 'Point' &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    // 툴팁 스타일 추가
    tipPoint = geometry;
    tooltipTextStyle.getText().setText(tip);
    styles.push(tooltipTextStyle);
  }
  return styles;
}

// 새로운 벡터 레이어 생성
const vector = new VectorLayer({
  source: Dsource,
  style: function (feature) {
    return styleFunction(feature, showSegments.checked);
  },
});

// 생성한 벡터 레이어를 맵에 추가
map.addLayer(vector);
// 수정 인터랙션을 맵에 추가
map.addInteraction(modify);

let draw1;
function addInteraction(drawType) {
  //호버 비활성화
  map.removeInteraction(mouseHoverSelect);
  // 선택 기능 비활성화
  map.removeInteraction(select);

  const activeTip = '다음점' + (drawType === 'Polygon' ? 'polygon' : '(종료시 더블클릭)');
  const idleTip = '시작점';
  let tip = idleTip;

  draw1 = new Draw({
    source: Dsource,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  // 그리기 시작 이벤트
  draw1.on('drawstart', function () {
    if (clearPrevious.checked) {
      Dsource.clear(); // 이전 피처 삭제
    }
    modify.setActive(false); // 수정 인터랙션 비활성화
    tip = activeTip;
  });
  // 그리기 종료 이벤트
  draw1.on('drawend', function (event) {
    event.feature.set('keep', true); // 피처에 'keep' 속성 설정
    modifyPointStyle.setGeometry(tipPoint); // 수정 포인트 스타일 설정
    modify.setActive(true); // 수정 인터랙션 활성화
    map.once('pointermove', function () {
      modifyPointStyle.setGeometry(); // 포인터가 움직이면 수정 포인트 스타일 초기화
    });
    tip = idleTip;
  });

  map.addInteraction(draw1); // 그리기 인터랙션 추가
  modify.setActive(true); // 수정 인터랙션 활성화
}

// 그리기 타입 설정
function setDrawType(type) {
  if (draw1) {
    map.removeInteraction(draw1); // 기존 그리기 인터랙션 제거
    draw1 = null;
  }
  addInteraction(type); // 새로운 그리기 인터랙션 추가
}

// 거리 측정 버튼 클릭 이벤트
document.getElementById('distanceButton').addEventListener('click', function () {
  setDrawType('LineString');
});
// 면적 측정 버튼 클릭 이벤트
document.getElementById('areaButton').addEventListener('click', function () {
  setDrawType('Polygon');
});
// 세그먼트 표시 옵션 변경 이벤트
showSegments.addEventListener('change', function () {
  vector.changed(); // 벡터 레이어 업데이트
  if (draw1) {
    draw1.getOverlay().changed(); // 그리기 오버레이 업데이트
  }
});
// 'keydown' 이벤트 (ESC로 그리기 인터랙션 제거)
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    if (draw1) {
      map.removeInteraction(draw1);
      draw1 = null;
    }
    //호버 활성화
    map.addInteraction(mouseHoverSelect);
    // 선택 기능 활성화
    map.addInteraction(select);
  }
});
// 이전 피처 삭제 옵션 변경 이벤트
clearPrevious.addEventListener('change', function () {
  if (clearPrevious.checked) {
    Dsource.clear();
  }
});

/* 폴리곤 생성/저장/삭제 */
let drawInteraction; // 전역 변수로 draw 초기화
// 폴리곤 그리기 상호작용 함수
function addDrawInteraction(drawType) {
  drawInteraction = new Draw({
    source: polygonSource1,
    type: drawType, // 사용자 정의 변수 drawType을 사용하여 도형 유형 설정
  });

  // 폴리곤이 그려질 때, 이를 화면에 유지
  drawInteraction.on('drawend', function(event) {
    console.log('폴리곤 그리기 완료:', event.feature);
    map.removeInteraction(drawInteraction);
    alert('폴리곤 그리기가 완료되었습니다');
  });

  map.addInteraction(drawInteraction); // 맵에 인터랙션 상호작용 추가
  alert('폴리곤 그리기를 시작합니다.');
}

// 선택 상호작용 추가
const selectInteraction = new Select();
map.addInteraction(selectInteraction);

// '폴리곤 생성' 버튼 클릭 이벤트
document.getElementById('createPolygonButton').addEventListener('click', function () {
  if(drawInteraction) {
    map.removeInteraction(drawInteraction);  // 기존 인터랙션 제거
  }
  addDrawInteraction('Polygon');  // 새로운 폴리곤 그리기 인터랙션 추가
});

// 'keydown' 이벤트 (ESC로 그리기 인터랙션 제거)
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
      drawInteraction = null;  // 현재 인터랙션 초기화
    }
  }
});

// 생성한 폴리곤 레이어를 지도에 추가
map.addLayer(polygonLayer1);

// 폴리곤을 서버에 저장하는 함수
function savePolygonToServer() {
  const features = polygonSource1.getFeatures();
  if (features.length > 0) {
    const format = new GeoJSON();
    const geojsonStr = format.writeFeatures(features);
    const geojson = JSON.parse(geojsonStr);

    geojson.features.forEach(feature => {
      const data = new URLSearchParams();
      data.append('geom', JSON.stringify(feature.geometry));

      fetch('createPolygon.jsp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      })
      .then(response => response.text())
      .then(result => {
        console.log('Polygon saved:', result);
        alert('폴리곤이 데이터베이스에 성공적으로 저장되었습니다!');
      })
      .catch(error => {
        console.error('Error:', error);
        alert('데이터베이스에 폴리곤을 저장하는 데 실패했습니다.');
      });
    });
  } else {
    alert('저장할 폴리곤이 없습니다.');
  }
}

// 선택된 폴리곤을 서버에서 삭제하는 함수
function deletePolygonsFromServer(features) {
  if (features.length > 0) {
    features.forEach(feature => {
      const id = feature.get('id'); // 실제 데이터베이스 id를 가져옴
      console.log('Deleting polygon with id:', id); // 디버깅을 위한 출력
      const data = new URLSearchParams();
      data.append('id', id);

      fetch('deletePolygon.jsp', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: data.toString(),
      })
      .then(response => response.text())
      .then(result => {
          console.log('Polygon deleted:', result);
          alert('폴리곤이 데이터베이스에서 성공적으로 삭제되었습니다!');
      })
      .catch(error => {
          console.error('Error:', error);
          alert('데이터베이스에서 폴리곤을 삭제하는 데 실패했습니다.');
      });
    });
  } else {
      alert('삭제할 폴리곤이 없습니다.');
  }
}

// 선택된 폴리곤 삭제(지도에서)
function deleteSelectedPolygons() {
  const selectedFeatures = selectInteraction.getFeatures();
  if (selectedFeatures.getLength() > 0) {
      const featuresToDelete = selectedFeatures.getArray().slice();
      featuresToDelete.forEach((feature) => {
        polygonSource1.removeFeature(feature);
      });
      selectedFeatures.clear();
      alert('선택된 폴리곤이 삭제되었습니다.');
  } else {
      alert('삭제할 폴리곤이 선택되지 않았습니다.');
  }
}

// 선택된 폴리곤 삭제(DB에서)
function deleteSelectedPolygonsFromDB() {
  const selectedFeatures = selectInteraction.getFeatures();
  if (selectedFeatures.getLength() > 0) {
    const featuresToDelete = selectedFeatures.getArray().slice();
    deletePolygonsFromServer(featuresToDelete); // DB에서 삭제
  } else {
    alert('삭제할 폴리곤이 선택되지 않았습니다.');
  }
}

// "폴리곤 저장" 버튼 클릭 시 폴리곤을 DB에 보냄
document.getElementById('saveButton').addEventListener('click', savePolygonToServer);

// "폴리곤 삭제(지도에서)" 버튼 클릭 시 선택된 폴리곤을 삭제
document.getElementById('removeButton').addEventListener('click', deleteSelectedPolygons);

// "폴리곤 삭제(서버에서)" 버튼 클릭 시 선택된 폴리곤을 DB에서 삭제
document.getElementById('deleteButton').addEventListener('click', deleteSelectedPolygonsFromDB);

// 페이지 로드 시 상호작용 추가
document.addEventListener('DOMContentLoaded', function () {
  map.addInteraction(selectInteraction);
  map.addInteraction(mouseHoverSelect);
});

/* 선택 관련 */
// 선택된 객체 스타일 정의
const selectedStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  }),
  stroke: new Stroke({
    color: 'rgba(33, 150, 243, 0.7)',
    width: 3,
  })
});

// 선택 도구
const select = new Select({
  style: function (feature) {
    const color = feature.get('COLOR_BIO') || 'rgba(255, 255, 255, 0.6';
    selectedStyle.getFill().setColor(color);
    return selectedStyle;
  }
});

// 선택 활성화
map.addInteraction(select);

// 선택한 피처 값 가져오기
const selectedFeatures = select.getFeatures();

/* JQuery를 이용하여 HTML 입력 값(SUM) 가져옴 */
// 개발적성값
function calculateSum(){
  const sub1 = parseFloat($('#sub1').val()) || 0;
  const sub2 = parseFloat($('#sub2').val()) || 0;
  const sub3 = parseFloat($('#sub3').val()) || 0;
  const sub4 = parseFloat($('#sub4').val()) || 0;
  const sub5 = parseFloat($('#sub5').val()) || 0;
  const sub6 = parseFloat($('#sub6').val()) || 0;

  const sum1 = sub1 + sub2 + sub3 + sub4 + sub5 + sub6;
  $('#sub7').text(sum1);

  // 보전적성값
  const sub8 = parseFloat($('#sub8').val()) || 0;
  const sub9 = parseFloat($('#sub9').val()) || 0;
  const sub10 = parseFloat($('#sub10').val()) || 0;
  const sub11 = parseFloat($('#sub11').val()) || 0;
  const sub12 = parseFloat($('#sub12').val()) || 0;
  const sub13 = parseFloat($('#sub13').val()) || 0;

  const sum2 = sub8 + sub9 + sub10 + sub11 + sub12 + sub13;
  $('#sub14').text(sum2);

  // 종합적성값
  const totalSum = sum1 - sum2;
  $('#sub15').text(totalSum);

  // console.log("선택된 피처의 종합적성값:", totalSum);

/* 종합적성값 구간에 따라 다른 스타일 적용 */
// Select 객체를 종합적성값 구간에 따라 다른 색상을 줌
  selectedFeatures.forEach(function (feature) {
    feature.set('sub15', totalSum);
    // console.log("Feature ID:", feature.getId(), "totalsum:", feature.get('totalsum'));
    feature.setStyle(vectorLayerStyleFunction(feature));
  });

  selectedFeatures.forEach(function (feature) {
    feature.set('sub15', totalSum);
    // console.log("Polygon Feature ID:", feature.getId(), "totalsum:", feature.get('totalsum'));
    feature.setStyle(polygonLayerStyleFunction(feature));
  });
}

// 저장된 스타일 로드 및 적용
function loadSavedStyles() {
  const savedStyles = JSON.parse(localStorage.getItem('savedStyles')) || {};
  vectorLayer.getSource().getFeatures().forEach(function (feature) {
    const featureId = feature.getId();
    const styleColor = savedStyles[featureId];
    if (styleColor) {
      feature.setStyle(vectorLayerStyleFunction(feature));
      feature.set('customStyle', vectorLayerStyleFunction(feature));
    }
  });

  polygonLayer.getSource().getFeatures().forEach(function (feature) {
    const featureId = feature.getId();
    const styleColor = savedStyles[featureId];
    if (styleColor) {
      feature.setStyle(polygonLayerStyleFunction(feature));
      feature.set('customStyle', polygonLayerStyleFunction(feature));
    }
  });
}

// 페이지 로드 시 저장된 스타일 적용
document.addEventListener('DOMContentLoaded', loadSavedStyles);

// 선택된 피처의 스타일을 설정하고 로컬 스토리지에 저장
selectedFeatures.forEach(function (feature) {
  const style = vectorLayerStyleFunction(feature);
  feature.set('customStyle', style);
  const featureId = feature.getId();
  const savedStyles = JSON.parse(localStorage.getItem('savedStyles')) || {};
  // 피처 ID를 키로 사용해서 스타일 색상을 저장
  savedStyles[featureId] = style.getFill().getColor();
  // 로컬 스토리지에 저장된 스타일 업데이트
  localStorage.setItem('savedStyles', JSON.stringify(savedStyles));
});

// 폴리곤 피처의 스타일을 설정하고 로컬 스토리지에 저장
polygonSource.getFeatures().forEach(function (feature) {
  const style = polygonLayerStyleFunction(feature);
  feature.set('customStyle', style);
  const featureId = feature.getId();
  const savedStyles = JSON.parse(localStorage.getItem('savedStyles')) || {};
  // 피처 ID를 키로 사용해서 스타일 색상을 저장
  savedStyles[featureId] = style.getFill().getColor();
  // 로컬 스토리지에 저장된 스타일 업데이트
  localStorage.setItem('savedStyles', JSON.stringify(savedStyles));
});

/* JQuery를 이용하여 적성값 수정 */
// 개발적성값 수정
$(document).ready(function() {

// 개발적성 수정
  window.updateDevelop = function() {
    let data = gatherDevelopData();
    data.id = getDevelopId();

    // 선택된 버튼 확인
    const updateType = document.querySelector('input[name="updateType"]:checked').value;
    let developPromise;

    if (updateType === "updateDevelop") {
      // updateDevelop.jsp로 전송
      developPromise = $.post('updateDevelop.jsp', data);
    } else if (updateType === "updateDevelopPolygon") {
      // updateDevelopPolygon.jsp로 전송
      developPromise = $.post('updateDevelopPolygon.jsp', data);
    }

    developPromise.done(function(response) {
      alert('개발적성값 수정 성공');
    }).fail(function(error) {
      alert('개발적성값 수정 실패');
    });

    return developPromise;
  }

  // 보전적성 수정
  window.updateIntegrity = function() {
    let data = gatherIntegrityData();
    data.id = getIntegrityId();
    
    // 선택된 버튼 확인
    const updateType2 = document.querySelector('input[name="updateType2"]:checked').value;
    let integrityPromise;

    if (updateType2 === "updateIntegrity") {
      // updateIntegrity.jsp로 전송
      integrityPromise = $.post('updateIntegrity.jsp', data);
    } else if (updateType2 === "updateIntegrityPolygon") {
      // updateIntegrityPolygon.jsp로 전송
      integrityPromise = $.post('updateIntegrityPolygon.jsp', data);
    }

    integrityPromise.done(function(response) {
      alert('보전적성값 수정 성공');
    }).fail(function(error) {
      alert('보전적성값 수정 실패');
    });

    return integrityPromise;
  }

  // 두 요청이 모두 완료된 후 새로고침
  window.updateAll = function() {
    Promise.all([updateDevelop(), updateIntegrity()]).then(function() {
      location.reload(); // 새로고침
    });
  }

  // 각 요소들의 값 가져오기
  function gatherDevelopData() {
      return {
        sub1: $('#sub1').val(),
        sub2: $('#sub2').val(),
        sub3: $('#sub3').val(),
        sub4: $('#sub4').val(),
        sub5: $('#sub5').val(),
        sub6: $('#sub6').val(),
        sub7: $('#sub7').text(),
        sub15: $('#sub15').text()
      };
  }

  function gatherIntegrityData() {
      return {
        sub8: $('#sub8').val(),
        sub9: $('#sub9').val(),
        sub10: $('#sub10').val(),
        sub11: $('#sub11').val(),
        sub12: $('#sub12').val(),
        sub13: $('#sub13').val(),
        sub14: $('#sub14').text()
      };
  }
  // 개발적성 ID를 입력받는 요소에서 값을 가져옴
  function getDevelopId() {
    return $('#developId').val(); 
  }

  // 보전적성 ID를 입력받는 요소에서 값을 가져옴
  function getIntegrityId() {
    return $('#integrityId').val(); 
  }
});

/* 초기화 버튼 */
// 첫 번째 초기화 버튼 이벤트 추가
document.getElementById('resetButton').addEventListener('click', function () {
  // 개발적성 입력 필드를 0으로 설정
  $('#sub1, #sub2, #sub3, #sub4, #sub5, #sub6').val(0);

  // 개발적성 결과 값 설정
  $('#sub7').text(0);

  // 필요하다면 calculateSum 함수를 호출하여 값을 다시 계산
  calculateSum();
});

// 두 번째 초기화 버튼 이벤트 추가
document.getElementById('resetButton1').addEventListener('click', function () {
  // 보전적성 입력 필드를 0으로 설정
  $('#sub8, #sub9, #sub10, #sub11, #sub12, #sub13').val(0);

  // 보전적성 결과 값 설정
  $('#sub14').text(0);
  $('#sub15').text(0);

  // 필요하다면 calculateSum 함수를 호출하여 값을 다시 계산
  calculateSum();
});

/* DragBox */
// 보조키(Ctrl)를 사용한 DragBox 기능
const dragBox = new DragBox({
  condition: platformModifierKeyOnly,
});

// DragBox 활성화
map.addInteraction(dragBox);

// Drag하여 Select한 객체를 조건에 따라 다른 색상을 줌
dragBox.on('boxend', function () {
  // 기존 선택된 피처에 스타일을 설정
  selectedFeatures.forEach(function (feature) {
    const totalSum = feature.get('sub15'); // 피처의 'sub15' 속성 값 가져오기
    if (totalSum == null) {
      return defaultStyle;
    }
    
    if (totalSum <= 20) {
      return Style0020;
    } else if (totalSum > 20 && totalSum <= 40) {
      return Style2140;
    } else if (totalSum > 40 && totalSum <= 60) {
      return Style4160;
    } else if (totalSum > 60 && totalSum <= 80) {
      return Style6180;
    } else if (totalSum > 80 && totalSum <= 100) {
      return Style8100;
    } else {
      return defaultStyle;
    }
  });

  // DragBox 부분은 geoserver에서 제공하는 문서를 보고 참고함.
  const boxExtent = dragBox.getGeometry().getExtent();

  const worldExtent = map.getView().getProjection().getExtent();
  const worldWidth = getWidth(worldExtent);
  const startWorld = Math.floor((boxExtent[0] - worldExtent[0]) / worldWidth);
  const endWorld = Math.floor((boxExtent[2] - worldExtent[0]) / worldWidth);

  for (let world = startWorld; world <= endWorld; ++world) {
    const left = Math.max(boxExtent[0] - world * worldWidth, worldExtent[0]);
    const right = Math.min(boxExtent[2] - world * worldWidth, worldExtent[2]);
    const extent = [left, boxExtent[1], right, boxExtent[3]];

    // 벡터 소스에서 피처를 가져오기
    const vectorBoxFeatures = newWfsSource
      .getFeaturesInExtent(extent)
      .filter(
        (feature) =>
          !selectedFeatures.getArray().includes(feature) &&
          feature.getGeometry().intersectsExtent(extent),
      );

    // 폴리곤 소스에서 피처를 가져오기
    const polygonBoxFeatures = polygonSource
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

      // 벡터 피처 추가
      vectorBoxFeatures.forEach(function (feature) {
        const geometry = feature.getGeometry().clone();
        geometry.rotate(-rotation, anchor);
        if (geometry.intersectsExtent(extent)) {
          selectedFeatures.push(feature);
        }
      });

      // 폴리곤 피처 추가
      polygonBoxFeatures.forEach(function (feature) {
        const geometry = feature.getGeometry().clone();
        geometry.rotate(-rotation, anchor);
        if (geometry.intersectsExtent(extent)) {
          selectedFeatures.push(feature);
        }
      });
    } else {
      selectedFeatures.extend(vectorBoxFeatures);
      selectedFeatures.extend(polygonBoxFeatures);
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

/* 검색 창 기능 */
// 검색 창과 관련된 HTML 요소를 가져옴

// 벡터 레이어를 위한 커스텀 스타일 함수
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');

let selectedFeatureExtent = null;
let selectedListItem = null; // 현재 선택된 li 요소를 저장하는 변수
let vectorSource1 = new ol.source.Vector();
let vectorLayer1 = new ol.layer.Vector({
  source: vectorSource1,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 153, 255, 1)',
      width: 1,
    }),
    fill: new ol.style.Fill({
      color: 'rgba(89, 89, 241, 0.5)',
    }),
  }),
});

map.addLayer(vectorLayer1); // 초기에 레이어 추가

const selectInteraction1 = new ol.interaction.Select({
  condition: ol.events.condition.click,
  layers: [vectorLayer1]
});
map.addInteraction(selectInteraction1);

// 호버 인터랙션
const hoverInteraction = new ol.interaction.Select({
  condition: ol.events.condition.pointerMove,
  layers: [vectorLayer1],
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 153, 255, 2)',
      width: 3,
    }),
    fill: new ol.style.Fill({
      color: 'rgba(47, 81, 109, 0.7)',
    }),
  }),
});
map.addInteraction(hoverInteraction);

// 검색결과 지도에 추가
function addFeatureToMapNew(features) {
  vectorSource1.clear();
  const geojsonFormat = new ol.format.GeoJSON();
  const olFeatures = geojsonFormat.readFeatures(features);

  // 종합적성값에 따른 스타일 적용
  olFeatures.forEach(feature => {
    const totalsum = feature.get('sub15');
    const style = getStyleByTotalSum(totalsum);
    feature.setStyle(style);
  });

  vectorSource1.addFeatures(olFeatures);

  const extent = vectorSource1.getExtent();
  if (extent && extent.length === 4) {
    selectedFeatureExtent = extent;
    map.getView().fit(extent, { size: map.getSize(), padding: [150, 150, 150, 150] });
  }
}

// 검색창 내용이 변경될 때의 처리
searchInput.addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    const searchText = searchInput.value.trim();

    // 입력이 없으면 검색 결과 창을 비움
    if (searchText === '') {
      searchResults.innerHTML = '';
      clearSelection();
      return; // 검색어가 없으면 더 이상 진행하지 않음
    }

    // GeoServer에서 검색할 때 필요한 URL 생성
    const geoServerUrl = `${g_url}/geoserver/jinjuWS/ows`;

    // 검색어
    const searchText1 = `${searchText}%`; // 검색어로 시작하는 경우
    const searchText2 = `%${searchText}`; // 검색어로 끝나는 경우
    const exactValue = searchText; // 정확히 일치하는 경우

    const filter = `(jinju_do_2 LIKE '${searchText1}' OR jinju_do_2 LIKE '${searchText2}' OR jinju_do_2 = '${exactValue}')`;
    const fullUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:jj&maxFeatures=1000&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(filter)}`;

    // console.log(fullUrl); // 최종 URL 확인용 로그

// jQuery를 이용한 AJAX 요청
fetch(fullUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json(); // JSON으로 응답 받기
    } else {
      return response.text().then(text => {
        throw new Error(`Unexpected content type: ${contentType}\n${text}`);
      });
    }
  })
  .then(data => {
    // 여기서 data를 활용하여 원하는 작업을 수행합니다.
    searchResults.innerHTML = ''; // 검색 결과 창 비우기

    const features = data.features;
    if (features.length > 0) {
      features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature.properties.jinju_do_2; // 예시로 속성 중 하나를 표시
        li.addEventListener('click', () => {
          const selectedFeature = new GeoJSON().readFeature(feature);
          map.getView().fit(selectedFeature.getGeometry().getExtent(), { size: map.getSize(), padding: [150, 150, 150, 150] });
  
          // 선택된 필지를 선택 인터랙션에 반영
          selectInteraction1.getFeatures().clear();
          selectInteraction1.getFeatures().push(selectedFeature);

          if (selectedListItem) {
            selectedListItem.classList.remove('selected');
          }

          li.classList.add('selected');
          selectedListItem = li;

        });
        searchResults.appendChild(li);
      });

      // 검색된 위치로만 확대하고 자동 선택되지 않도록 변경
      if (features.length > 0) {
        const firstFeature = new GeoJSON().readFeature(features[0]);
        map.getView().fit(firstFeature.getGeometry().getExtent(), { size: map.getSize(), padding: [150, 150, 150, 150] });
      }

      // 검색 결과를 지도에 추가
      addFeatureToMapNew(data);

    } else {
      searchResults.innerHTML = '<li>검색 결과가 없습니다</li>';
    }
  })
  .catch(error => {
    // 네트워크 오류 또는 처리할 수 없는 경우
    console.error('Error fetching search results:', error);
    console.error(`Full URL: ${fullUrl}`);  // 요청 URL을 로그에 출력
    searchResults.innerHTML = `<li>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</li>`;
  });

  } else {
    searchResults.innerHTML = '';
    vectorSource1.clear();
  }
});

/* 지도 클릭 */
// 지도 클릭 이벤트. 오버레이를 처리
map.on('click', (e) =>
  {
    // console.log(e);

    // 점찍은 곳의 자료를 찾아냄. geoserver에서는 WFS를 위해 위치 정보 뿐 아니라 메타데이터도 같이 보내고 있음
    map.forEachFeatureAtPixel(e.pixel, (feature) =>
      {
        var id = feature.get('id');
        $('#developId').val(id); // 개발적성 ID로 설정
        $('#integrityId').val(id); // 보전적성 ID로 설정

    // JQUERY를 이용한 area1 창에 정보 표시
    $(document).ready(function(){
      var featureMappings = [
          { id: 'pnu', key: 'pnu' },
          { id: 'do', key: 'jinju_do_1' },
          { id: 'cada', key: 'jinju_cada' },
          { id: 'jibun', key: 'jinju_jibu' },
          { id: 'jimok', key: 'jinju_ji_1' },
          { id: 'are', key: 'jinju_area' },
          { id: 'price', key: 'jinju_pric' },
          { id: 'owner', key: 'jinju_ow_1' },
          { id: 'owner_re', key: 'jinju_ch_1' },
          { id: 'owner_da', key: 'jinju_ch_2' },
          { id: 'score1', key: 'sub1' },
          { id: 'score2', key: 'sub2' },
          { id: 'score3', key: 'sub3' },
          { id: 'score4', key: 'sub4' },
          { id: 'score5', key: 'sub5' },
          { id: 'score6', key: 'sub6' },
          { id: 'score7', key: 'sub8' },
          { id: 'score8', key: 'sub9' },
          { id: 'score9', key: 'sub10' },
          { id: 'score10', key: 'sub11' },
          { id: 'score11', key: 'sub12' },
          { id: 'score12', key: 'sub13' },
          { id: 'score13', key: 'sub15' }
      ];

      featureMappings.forEach(function(mapping) {
        var clickedFeature = feature.get(mapping.key);
        $('#' + mapping.id).text(clickedFeature);
        $('#' + mapping.id).attr('data-clicked-feature-' + mapping.key, clickedFeature);
      });
    });

    $(document).ready(function(){
      $('#inputForm').on('submit', function(event){
        event.preventDefault();
        calculateSum();
      });
    // 입력 값이 변경될 때마다 calculateSum 함수 호출
    $('#sub1, #sub2, #sub3, #sub4, #sub5, #sub6, #sub8, #sub9, #sub10, #sub11, #sub12, #sub13').on('input', calculateSum);
    });
  });
});

// 읍면 사이드바 클릭 시 이벤트
const ymList = Array.from({ length: 16 }, (_, i) => `ym${String(i + 1).padStart(2, '0')}`);
  ymList.forEach(ym => {
    const ymElement = document.getElementById(ym);
    if (ymElement) {
      ymElement.onclick = () => {
        console.log(`Clicked: ${ym}`);  // 클릭된 ID 확인용 로그
        makeWFSSource(ym);
      };
    } else {
      console.error(`Element not found: ${ym}`);  // 요소가 없을 경우 로그 출력
    }
  });
  
// 동 사이드바 클릭 시 이벤트
const dongList = Array.from({ length: 13 }, (_, i) => `dong${i + 1}`);
dongList.forEach(dong => {
  const dongElement = document.getElementById(dong);
  if (dongElement) {
    dongElement.onclick = () => {
      console.log(`Clicked: ${dong}`);
      makeWFSSource(dong);
    };
  }
});

/* 좌표 기능 */
// 지도에 마우스 이동 이벤트 추가
const mouseCoord = document.getElementById('mouseCoord');

// 좌표값을 업데이트하는 함수
function updateMousePosition(coordinate) {
  const [x,y] = coordinate;
  const coord = `좌표: ${x.toFixed(0)}, ${y.toFixed(0)}`;
  mouseCoord.innerHTML = coord;
}

// 지도에 마우스 이동 이벤트 추가
map.on('pointermove', function(evt) {
  const coordinate = evt.coordinate;
  updateMousePosition(coordinate);
});