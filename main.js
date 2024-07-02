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

// 팝업창을 위해
import { Overlay } from 'ol';

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
const g_url = "http://localhost:42888";// 내부용
// const g_url = "http://172.20.221.180:42888";// 외부용

let wfsSource = null;
let wfsLayer = null;

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
  fill: new Fill({ color: 'rgba(75, 240, 26, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

// 0~30 값 스타일
const Style0030 = new Style({
  fill: new Fill({ color: 'rgba(251, 199, 28, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

//31~60 값 스타일
const Style3160 = new Style({
  fill: new Fill({ color: 'rgba(251, 121, 28, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

//61~100 값 스타일
const Style6100 = new Style({
  fill: new Fill({ color: 'rgba(251, 28, 28, 0.5)' }),
  stroke: new Stroke({ color: 'rgba(0, 0, 0, 1.0)', width: 1 })
});

// Vector 레이어 생성
const vectorLayer = new VectorLayer({
  source: wfsSource,
  style: function (feature) {
    return feature.get('customStyle') || defaultStyle; // customStyle을 참조, 없으면 defaultStyle 사용
  },
});

// Geoserver에서 Vector 레이어 불러오기
let newWfsSource;

function makeWFSSource(method) {
  newWfsSource = new VectorSource
    (
      {
        format: new GeoJSON(),
        url: encodeURI(`${g_url}/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:jj&maxFeatures=1000&outputFormat=application/json&CQL_FILTER=${makeFilter(method)}`)
      }
    );

  vectorLayer.setSource(newWfsSource);
}

makeWFSSource("");

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

// OSM 레이어 생성
const osmLayer = new TileLayer({
  source: new OSM()
});

// 벡터 소스와 레이어 정의
const polygonSource = new VectorSource();
const vectorLayerP = new VectorLayer({
  source: polygonSource,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.6)',
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2,
    }),
  }),
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
    vectorLayer, // 백터 레이어
    vectorLayerP
  ],
  target: 'map',
  overlays: [overlay],
  view: new View({
    center: fromLonLat([128.1298, 35.2052]),
    zoom: 10,
    constrainRotation: 16,
    interactions: defaults().extend([mouseHoverSelect])
  })
});

// 위성 지도 레이어
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

let draw; // 전역으로 설정하여 나중에 제거할 수 있게 함

function addInteraction(drawType) {
  draw = new Draw({
    source: polygonSource,
    type: drawType,
  });
  map.addInteraction(draw);

  draw.on('drawend', function (event) {
    const feature = event.feature;
    feature.set('id', -1);  // 기본 ID 설정
  });
}

// '폴리곤 생성' 버튼 클릭 이벤트 핸들러
document.getElementById('createPolygonButton').addEventListener('click', function () {
  map.removeInteraction(draw);  // 기존 인터랙션 제거
  addInteraction('Polygon');  // 새로운 폴리곤 그리기 인터랙션 추가
});

// 폴리곤을 서버에 저장하는 함수
function savePolygonToServer() {
  const features = polygonSource.getFeatures();
  if (features.length > 0) {
    const format = new GeoJSON();
    const geojsonStr = format.writeFeatures(features);
    const geojson = JSON.parse(geojsonStr);

    geojson.features.forEach(feature => {
      const data = new URLSearchParams();
      data.append('id', feature.properties.id);
      data.append('geom', JSON.stringify(feature.geometry));

      fetch('insertPolygon.jsp', {
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

document.getElementById('saveButton').addEventListener('click', savePolygonToServer);

// 그리기 완료 후 상호작용 리셋 함수
function resetPolygonInteraction() {
  if (draw) {
    map.removeInteraction(draw);
    draw = null;
  }
  if (typeof mouseHoverSelect !== 'undefined') {
    map.addInteraction(mouseHoverSelect);
  }
  if (typeof select !== 'undefined') {
    map.addInteraction(select);
  }
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    if (draw) {
      map.removeInteraction(draw);
      draw = null;
    }
  }
});

// Geoserver에서 Vector 레이어 불러오기
let polyWfsSource;

function makeWFSSource1(method) {
  polyWfsSource = new VectorSource
    (
      {
        format: new GeoJSON(),
        url: encodeURI(`${g_url}/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:make&outputFormat=application/json&CQL_FILTER=${makeFilter(method)}`)
      }
    );

  vectorLayer.setSource(polyWfsSource);
}

makeWFSSource1("");



// Mouse Hover 활성화
map.addInteraction(mouseHoverSelect);

const selectedStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 3,
  })
});

// Select 도구
const select = new Select({
  style: function (feature) {
    const color = feature.get('COLOR_BIO') || 'rgba(108, 169, 131, 0.5';
    selectedStyle.getFill().setColor(color);
    return selectedStyle;
  }
});

// Select 활성화
map.addInteraction(select);

// Select 피처 값 가져오기
const selectedFeatures = select.getFeatures();

// JQuery를 이용하여 HTML 입력 값(SUM) 가져옴 
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

// Select 객체를 종합적성값 구간에 따라 다른 색상을 줌
  selectedFeatures.forEach(function (feature) {
    let style;
    if (totalSum < 30) {
      style = Style0030;
    } else if (totalSum >= 30 && totalSum < 60) {
      style = Style3160;
    } else {
      style = Style6100;
    }
    feature.setStyle(style);
    feature.set('customStyle', style); // 스타일 정보를 feature 객체에 저장

    // 로컬 스토리지에 스타일 정보 저장
    const featureId = feature.getId();
    const savedStyles = JSON.parse(localStorage.getItem('savedStyles')) || {};
    savedStyles[featureId] = style.getFill().getColor();
    localStorage.setItem('savedStyles', JSON.stringify(savedStyles));
  });
}

// 지도 초기화 시 기존 저장된 스타일 적용
function loadSavedStyles() {
  const savedStyles = JSON.parse(localStorage.getItem('savedStyles')) || {};
  vectorLayer.getSource().getFeatures().forEach(function (feature) {
    const featureId = feature.getId();
    const styleColor = savedStyles[featureId];
    if (styleColor) {
      let style;
      if (styleColor === 'rgba(251, 199, 28, 0.5)') {
        style = Style0030;
      } else if (styleColor === 'rgba(251, 121, 28, 0.5)') {
        style = Style3160;
      } else if (styleColor === 'rgba(251, 28, 28, 0.5)') {
        style = Style6100;
      }
      feature.setStyle(style);
      feature.set('customStyle', style);
    }
  });
}

// 페이지 로드 시 저장된 스타일 로드
document.addEventListener('DOMContentLoaded', loadSavedStyles);

// 저장된 스타일 삭제
function clearSavedStyles() {
  localStorage.removeItem('savedStyles');
  vectorLayer.getSource().getFeatures().forEach(function (feature) {
    feature.setStyle(defaultStyle); // 기본 스타일로 초기화
    feature.unset('customStyle');
  });
}

// 버튼 클릭 시 저장된 스타일 삭제
document.getElementById('clearStylesButton').addEventListener('click', clearSavedStyles);

// JQuery를 이용하여 적성값 입력, 수정, 삭제
// 개발적성
$(document).ready(function() {
  window.insertDevelop = function() {
      let data = gatherDevelopData();
      $.post('insertDevelop.jsp', data)
          .done(function(response) {
              alert('개발적성 입력 성공');
          })
          .fail(function(error) {
              alert('개발적성 입력 실패');
          });
  };

  window.updateDevelop = function() {
      let data = gatherDevelopData();
      data.id = getDevelopId();
      $.post('updateDevelop.jsp', data)
          .done(function(response) {
              alert('개발적성 수정 성공');
          })
          .fail(function(error) {
              alert('개발적성 수정 실패');
          });
  };

  window.deleteDevelop = function() {
      let id = getDevelopId();
      $.post('deleteDevelop.jsp', { id: id })
          .done(function(response) {
              alert('개발적성 삭제 성공');
          })
          .fail(function(error) {
              alert('개발적성 삭제 실패');
          });
  };

  // 보전적성
  window.insertIntegrity = function() {
      let data = gatherIntegrityData();
      $.post('insertIntegrity.jsp', data)
          .done(function(response) {
              alert('보전적성 입력 성공');
          })
          .fail(function(error) {
              alert('보전적성 입력 실패');
          });
  };

  window.updateIntegrity = function() {
      let data = gatherIntegrityData();
      data.id = getIntegrityId();
      $.post('updateIntegrity.jsp', data)
          .done(function(response) {
              alert('보전적성 수정 성공');
          })
          .fail(function(error) {
              alert('보전적성 수정 실패');
          });
  };

  window.deleteIntegrity = function() {
      let id = getIntegrityId();
      $.post('deleteIntegrity.jsp', { id: id })
          .done(function(response) {
              alert('보전적성 삭제 성공');
          })
          .fail(function(error) {
              alert('보전적성 삭제 실패');
          });
  };

  // 각 요소들의 값 가져오기
  function gatherDevelopData() {
      return {
          sub1: $('#sub1').val(),
          sub2: $('#sub2').val(),
          sub3: $('#sub3').val(),
          sub4: $('#sub4').val(),
          sub5: $('#sub5').val(),
          sub6: $('#sub6').val()
      };
  }

  function gatherIntegrityData() {
      return {
          sub8: $('#sub8').val(),
          sub9: $('#sub9').val(),
          sub10: $('#sub10').val(),
          sub11: $('#sub11').val(),
          sub12: $('#sub12').val(),
          sub13: $('#sub13').val()
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

// 보조키(Ctrl)를 사용한 DragBox 기능
const dragBox = new DragBox({
  condition: platformModifierKeyOnly,
});

// DragBox 활성화
map.addInteraction(dragBox);

// Drag하여 Select한 객체를 조건에 따라 다른 색상을 줌
dragBox.on('boxend', function () {
  selectedFeatures.forEach(function (feature) {
    if (sum1 < 30) {
      feature.setStyle(Style0030);
    } else if (sum1 > 30 && sum1 < 60) {
      feature.setStyle(Style3160);
    } else {
      feature.setStyle(Style6100);
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

// 검색 창과 관련된 HTML 요소를 가져옴
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
const insidebar = document.querySelector(".landinfo");

let selectedFeatureExtent = null;
let selectedListItem = null; // 현재 선택된 li 요소를 저장하는 변수

let vectorSource1 = new VectorSource();
let vectorLayer1 = new VectorLayer({
  source: vectorSource1,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(79, 252, 211, 0.5)',
    }),
  }),
});

map.addLayer(vectorLayer1); // 초기에 레이어 추가

// 검색결과 지도에 추가
function addFeatureToMapNew(features) {
  vectorSource1.clear();
  const geojsonFormat = new ol.format.GeoJSON();
  const olFeatures = geojsonFormat.readFeatures(features);

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
    return response.json(); // JSON으로 응답 받기
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

          if (selectedListItem) {
            selectedListItem.classList.remove('selected');
          }
          li.classList.add('selected');
          selectedListItem = li;
        });
        searchResults.appendChild(li);
      });

      addFeatureToMapNew(data); // 지도에 피처 추가하는 함수 호출

    } else {
      searchResults.innerHTML = '<li>검색 결과가 없습니다</li>';
    }
  })
  .catch(error => {
    // 네트워크 오류 또는 처리할 수 없는 경우
    console.error('Error fetching search results:', error);
    searchResults.innerHTML = '<li>데이터를 불러오는 중 오류가 발생했습니다</li>';
  });

  } else {
    searchResults.innerHTML = '';
    vectorSource1.clear();
  }
});

// 검색 결과를 처리하고 지도에 표시하는 함수
function displaySearchResults(data) {
  // 검색 결과 select 요소 변경 시 처리
  const selectElement = searchResults.querySelector('select');
  if (selectElement) {
    selectElement.addEventListener('change', function() {
      const selectedIndex = selectElement.value;
      const selectedFeature = data.features[selectedIndex]; // 선택된 feature 가져오기

      handleSelectChange(selectedFeature); // 선택된 항목 처리 함수 호출
    });
  }
}

// 선택된 항목 처리 함수 (select 요소 변경 시)
function handleSelectChange(feature) {
  clearSelection(); // 이전 선택 초기화
  addFeatureToMapNew(feature); // 선택된 항목 지도에 표시 함수 호출
  showFeatureInfo(feature); // 토지 정보 표시 함수 호출
}

// 토지 정보 표시 함수
function showFeatureInfo(feature) {
  const properties = feature.properties;
  if (properties) {
    const html = `
      PNU : <div style="display: inline-block;" id="pnu">${properties.pnu}</div><br>
      소재지 : <div style="display: inline-block;" id="do">${properties.jinju_do_1}</div><br>
      대장구분 : <div style="display: inline-block;" id="cada">${properties.jinju_cada}</div><br>
      지번 : <div style="display: inline-block;" id="jibun">${properties.jinju_jibu}</div><br>
      지목 : <div style="display: inline-block;" id="jimok">${properties.jinju_ji_1}</div><br>
      면적(㎡) : <div style="display: inline-block;" id="are">${properties.jinju_area}</div><br>
      공시지가(원) : <div style="display: inline-block;" id="price">${properties.jinju_pric}</div><br>
      소유구분 : <div style="display: inline-block;" id="owner">${properties.jinju_ow_1}</div><br>
      소유권변동사유 : <div style="display: inline-block;" id="owner_re">${properties.jinju_ch_1}</div><br>
      소유권변동일자 : <div style="display: inline-block;" id="owner_da">${properties.jinju_ch_2}</div><br>
      경사도 : <div style="display: inline-block;" id="score1">${properties.sub1}</div><br>
      표고 : <div style="display: inline-block;" id="score2">${properties.sub2}</div><br>
      기개발지와의 거리 : <div style="display: inline-block;" id="score3">${properties.sub3}</div><br>
      공공편익시설과의 거리 : <div style="display: inline-block;" id="score4">${properties.sub4}</div><br>
      지가수준 : <div style="display: inline-block;" id="score5">${properties.sub5}</div><br>
      도로와의 거리 : <div style="display: inline-block;" id="score6">${properties.sub6}</div><br>
      경지정리면적 비율 : <div style="display: inline-block;" id="score7">${properties.sub8}</div><br>
      생태·자연도상위등급 비율 : <div style="display: inline-block;" id="score8">${properties.sub9}</div><br>
      공적규제지역면적 비율 : <div style="display: inline-block;" id="score9">${properties.sub10}</div><br>
      공적규제지역과의 거리 : <div style="display: inline-block;" id="score10">${properties.sub11}</div><br>
      농업진흥지역 비율 : <div style="display: inline-block;" id="score11">${properties.sub12}</div><br>
      하천·호소·농업용저수지와의 거리 : <div style="display: inline-block;" id="score12">${properties.sub13}</div><br>
    `;
    insidebar.innerHTML = html;
  }
}

// 이전 선택 초기화 함수
function clearSelection() {
  // 이전에 선택된 항목의 배경색 초기화
  if (selectedListItem) {
    selectedListItem.style.backgroundColor = '';
    selectedListItem = null;
  }
}

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
      var clickedFeature1 = feature.get('pnu');
      $('#pnu').text(clickedFeature1);
      $('#pnu').attr('data-clicked-feature-pnu', clickedFeature1);
    })

    $(document).ready(function(){
      var clickedFeature2 = feature.get('jinju_do_1');
      $('#do').text(clickedFeature2);
      $('#do').attr('data-clicked-feature-jinju_do_1', clickedFeature2);
    })

    $(document).ready(function(){
      var clickedFeature3 = feature.get('jinju_cada');
      $('#cada').text(clickedFeature3);
      $('#cada').attr('data-clicked-feature-jinju_cada', clickedFeature3);
    })

    $(document).ready(function(){
      var clickedFeature4 = feature.get('jinju_jibu');
      $('#jibun').text(clickedFeature4);
      $('#jibun').attr('data-clicked-feature-jinju_jibu', clickedFeature4);
    })

    $(document).ready(function(){
      var clickedFeature5 = feature.get('jinju_ji_1');
      $('#jimok').text(clickedFeature5);
      $('#jimok').attr('data-clicked-feature-jinju_ji_1', clickedFeature5);
    })

    $(document).ready(function(){
      var clickedFeature6 = feature.get('jinju_area');
      $('#are').text(clickedFeature6);
      $('#are').attr('data-clicked-feature-jinju_area', clickedFeature6);
    })

    $(document).ready(function(){
      var clickedFeature7 = feature.get('jinju_pric');
      $('#price').text(clickedFeature7);
      $('#price').attr('data-clicked-feature-jinju_pric', clickedFeature7);
    })

    $(document).ready(function(){
      var clickedFeature8 = feature.get('jinju_ow_1');
      $('#owner').text(clickedFeature8);
      $('#owner').attr('data-clicked-feature-jinju_ow_1', clickedFeature8);
    })

    $(document).ready(function(){
      var clickedFeature9 = feature.get('jinju_ch_1');
      $('#owner_re').text(clickedFeature9);
      $('#owner_re').attr('data-clicked-feature-jinju_ch_1', clickedFeature9);
    })

    $(document).ready(function(){
      var clickedFeature10 = feature.get('jinju_ch_2');
      $('#owner_da').text(clickedFeature10);
      $('#owner_da').attr('data-clicked-feature-jinju_ch_2', clickedFeature10);
    })

    $(document).ready(function(){
      var clickedFeature11 = feature.get('sub1');
      $('#score1').text(clickedFeature11);
      $('#score1').attr('data-clicked-feature-sub1', clickedFeature11);
    })

    $(document).ready(function(){
      var clickedFeature12 = feature.get('sub2');
      $('#score2').text(clickedFeature12);
      $('#score2').attr('data-clicked-feature-sub2', clickedFeature12);
    })

    $(document).ready(function(){
      var clickedFeature13 = feature.get('sub3');
      $('#score3').text(clickedFeature13);
      $('#score3').attr('data-clicked-feature-sub3', clickedFeature13);
    })

    $(document).ready(function(){
      var clickedFeature14 = feature.get('sub4');
      $('#score4').text(clickedFeature14);
      $('#score4').attr('data-clicked-feature-sub4', clickedFeature14);
    })

    $(document).ready(function(){
      var clickedFeature15 = feature.get('sub5');
      $('#score5').text(clickedFeature15);
      $('#score5').attr('data-clicked-feature-sub5', clickedFeature15);
    })

    $(document).ready(function(){
      var clickedFeature16 = feature.get('sub6');
      $('#score6').text(clickedFeature16);
      $('#score6').attr('data-clicked-feature-sub6', clickedFeature16);
    })

    $(document).ready(function(){
      var clickedFeature17 = feature.get('sub8');
      $('#score7').text(clickedFeature17);
      $('#score7').attr('data-clicked-feature-sub8', clickedFeature17);
    })

    $(document).ready(function(){
      var clickedFeature18 = feature.get('sub9');
      $('#score8').text(clickedFeature18);
      $('#score8').attr('data-clicked-feature-sub9', clickedFeature18);
    })

    $(document).ready(function(){
      var clickedFeature19 = feature.get('sub10');
      $('#score9').text(clickedFeature19);
      $('#score9').attr('data-clicked-feature-sub10', clickedFeature19);
    })

    $(document).ready(function(){
      var clickedFeature20 = feature.get('sub11');
      $('#score10').text(clickedFeature20);
      $('#score10').attr('data-clicked-feature-sub11', clickedFeature20);
    })

    $(document).ready(function(){
      var clickedFeature21 = feature.get('sub12');
      $('#score11').text(clickedFeature21);
      $('#score11').attr('data-clicked-feature-sub12', clickedFeature21);
    })

    $(document).ready(function(){
      var clickedFeature22 = feature.get('sub13');
      $('#score12').text(clickedFeature22);
      $('#score12').attr('data-clicked-feature-sub13', clickedFeature22);
    })

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

// 읍면 사이드바 클릭 시 이벤트 처리
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
  
// 동 사이드바 클릭 시 이벤트 발생
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