// OpenLayers > Examples > WFS
// GeoServer에 있는 camping을 벡터파일로 서비스 후 꾸미기

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
import { Overlay} from 'ol';

// dragbox를 위해
import DragBox from 'ol/interaction/DragBox';
import {getWidth} from 'ol/extent.js';


// url을 변수로 빼서 따로 설정해 줘도 됨
const g_url = "http://localhost:42888";

let wfsSource = null;
let wfsLayer = null;

// 목록 클릭 시 CQL 필터 만드는 함수 추가 
function makeFilter(method) {
  let filter = "";

  if ('dong01' == method)
    filter = "jinju_do_1 LIKE '%호탄동%'";

  else if ('dong02' == method)
    filter = "jinju_do_1 LIKE '%평거동%'";

  return filter;
}

const defaultStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

const StyleLow = new Style({
  fill: new Fill({
    color: 'rgba(0, 255, 0, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

const StyleMedium = new Style({
  fill: new Fill({
    color: 'rgba(0, 0, 255, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

const StyleHigh = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 0, 0.5)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 1.0)',
    width: 1,
  }),
});

// Vector 레이어 생성
const vectorLayer = new VectorLayer({
  source: wfsSource,
  style: function (feature) {
    const color = feature.get('COLOR_BIO') || 'rgba(0, 255, 0, 0.5)';
    defaultStyle.getFill().setColor(color);
    return defaultStyle;
  },
});

let newWfsSource;

function makeWFSSource(method) {
  newWfsSource = new VectorSource
    (
      {
        format: new GeoJSON(),
        url: encodeURI(g_url + "/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature" +
          "&typeName=jinjuWS:jj&maxFeatures=1896&outputFormat=application/json&CQL_FILTER=" + makeFilter(method))
      }
    );

  vectorLayer.setSource(newWfsSource);
}

makeWFSSource("");

wfsLayer = new VectorLayer({
  source: wfsSource,
});

// 점에 hover 시 굵게 표시
const mouseHoverSelect = new Select({
  condition: pointerMove,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 20
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.5)'
    })
  })
});

// 점 클릭 시 굵게 표시
const mouseClickSelect = new Select({
  condition: click,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 5
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.5)'
    })
  })
});

// popup 창 설정을 위해서 변수 추가
const popup = document.getElementById('popup');

const overlay = new Overlay({
  element: popup,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

const osmLayer = new TileLayer({
  source: new OSM()
});

// 지도 생성
const map = new Map({
  layers: [
    osmLayer,    // 배경 지도 레이어
    vectorLayer // 피처 레이어
  ],
  target: 'map',
  overlays: [overlay],
  view: new View({
    center: fromLonLat([128.1298, 35.2052]),
    zoom: 10,
    constrainRotation: 16,
    interactions: defaults().extend([mouseHoverSelect, mouseClickSelect])
  }),
});

const selectedStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 3,
  }),
});

// JQuery를 이용하여 HTML 입력 값(SUM) 가져옴
function calculateSum(){
  var sub1 = parseFloat($('#sub1').val());
  var sub2 = parseFloat($('#sub2').val());
  var sub3 = parseFloat($('#sub3').val());

  var sum = sub1 + sub2 + sub3;

  $('#result').text('합계: ' + sum);

  if (sum < 30) {
    vectorLayer.setStyle(StyleLow);
  } else if (sum > 30 && sum < 60) {
    vectorLayer.setStyle(StyleMedium);
  } else {
    vectorLayer.setStyle(StyleHigh);
  }
}

// 클릭이벤트 처리 선택도구
const select = new Select({
  style: function (feature) {
    const color = feature.get('COLOR_BIO') || 'rgba(108, 169, 131, 0.5';
    selectedStyle.getFill().setColor(color);
    return selectedStyle;
  },
});

map.addInteraction(select);

const selectedFeatures = select.getFeatures();

// a DragBox interaction used to select features by drawing boxes
const dragBox = new DragBox({
  condition: platformModifierKeyOnly,
});

map.addInteraction(dragBox);

dragBox.on('boxend', function () {
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

    // features that intersect the box geometry are added to the
    // collection of selected features

    // if the view is not obliquely rotated the box geometry and
    // its extent are equalivalent so intersecting features can
    // be added directly to the collection
    const rotation = map.getView().getRotation();
    const oblique = rotation % (Math.PI / 2) !== 0;

    // when the view is obliquely rotated the box extent will
    // exceed its geometry so both the box and the candidate
    // feature geometries are rotated around a common anchor
    // to confirm that, with the box geometry aligned with its
    // extent, the geometries intersect
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

document.getElementById('dong01').onclick = () => {
  console.log('dong01 clicked');
  makeWFSSource('dong01');
}

document.getElementById('dong02').onclick = () => {
  console.log('dong02 clicked');
  makeWFSSource('dong02');
}

// 지도 클릭 이벤트. 오버레이를 처리
map.on('click', (e) =>
  {
    console.log(e);

    // 일단 창을 닫음. 이렇게 하면 자료가 없는 곳을 찍으면 창이 닫히는 효과가 나옴
    overlay.setPosition(undefined);

    // 점찍은 곳의 자료를 찾아냄. geoserver에서는 WFS를 위해 위치 정보 뿐 아니라 메타데이터도 같이 보내고 있음
    map.forEachFeatureAtPixel(e.pixel, (feature, layer) =>
      {
        // point와 같이 넘어온 메타데이터 값을 찾음
        let clickedFeatureID = feature.get('id');
        let clickedFeaturePNU = feature.get('pnu');

        // 메타데이터를 오버레이 하기 위한 div에 적음
        // document.getElementById("info-title").innerHTML = clickedFeatureName;
        document.getElementById("info-title").innerHTML = "[" + clickedFeaturePNU + "] "
        document.getElementById("jinju_link").href = "./detail.jsp?id=" + clickedFeatureID;

    // 오버레이 창을 띄움
    overlay.setPosition(e.coordinate);

    // JQUERY를 이용한 CONTENT1 창에 정보 표시
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
      $('#area').text(clickedFeature6);
      $('#area').attr('data-clicked-feature-jinju_area', clickedFeature6);
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
      $('#inputForm').on('submit', function(event){
        event.preventDefault();
        calculateSum();
      });
    });    
  });
});