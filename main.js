import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

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
import { pointerMove, click } from 'ol/events/condition';

// 팝업창을 위해
import { Overlay } from 'ol';








// url을 변수로 빼서 따로 설정해 줘도 됨
const g_url = "http://localhost:42888";

// CQL 필터 만들기. 모든 CQL은 이 함수를 통한다
function makeFilter()
{
  let filter = "";

  return filter;
}


// geoserver에서 WFS 방식으로 자료를 받아와 openLayers에서 소스로 사용하도록 한다.
const wfsSource = new VectorSource
(
  {
    format: new GeoJSON(),
    url: encodeURI(g_url + "/geoserver/jinjuWS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:jj&maxFeatures=2000&outputFormat=application/json&CQL_FILTER=" + makeFilter() )
  }
);


const WfsLayer = new VectorLayer
(
  {
    source: wfsSource, 
    style: new Style
    (
       {
				// 만약 레이어가 폴리곤이 있을 경우 적용 됨
         stroke: new Stroke
         (
           {
             color: 'rgba(130, 130, 130, 1)',
             width: 1
           }
         ),

         fill: new Fill
         (
           {
             color: 'rgba(255, 0, 0, 1)'
           }
         )
       }
    ) 
  }
);







// osm(오픈 소스 기반 지도 서비스) 레이어를 만든다. 
const osmLayer = new TileLayer
(
  {
    source: new OSM()
  }
);







const map = new Map({
  target: 'map',
  layers: [osmLayer, WfsLayer],
  view: new View({
    center: [14261274,4187593],
    zoom: 11.5
  })
});






