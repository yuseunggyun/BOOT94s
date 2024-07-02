6.27.(목) - 엔터를 쳤을 때 GeoJSON을 defined하는 오류가 생겼음.
          - 오류 분석결과 geoServerUrl을 불러오고 JSON으로 파싱하는 부분에서 문제발생

    const geoServerUrl = `${g_url}/geoserver/jinjuWS/ows`;

    // 검색어
    const searchText1 = searchText + '%'; // 검색어로 시작하는 경우
    const searchText2 = '%' + searchText; // 검색어로 끝나는 경우
    const exactValue = searchText; // 정확히 일치하는 경우

    const filter = `(jinju_do_2 LIKE '${searchText1}' OR jinju_do_2 LIKE '${searchText2}' OR jinju_do_2 = '${exactValue}')`;
    const fullUrl = `${geoServerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=jinjuWS:jj&maxFeatures=1000&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(filter)}`;

=>
    위 코드와 같이 수정하니 오류가 사라졌다.
    인코딩 부분에서 문제가 있어 제대로 파싱이 되지않았던것으로 판단.
    JSON 파싱에 대한 문제가 자주 발생.

6.28.(금) - 최종적으로 검색 기능구현 완료 
- 기존에 5개의 검색어가 나오던 기능을 모두 없애고 1개만 나오도록.
- 데이터가 없거나 찾을 수 없으면 검색결과가 없음 나오도록.
- 띄어쓰기(공백)이랑 상관없이 검색하도록 하려했으나 계속 오류생김 => 시간날때마다 수정해야할듯.


7.2.(화)
폴리곤을 생성하고 Geoserver 및 Database와 연동
=> Geoserver에 생성된 폴리곤이 생기고, 그 폴리곤을 다시 불러오는 코드 작성
