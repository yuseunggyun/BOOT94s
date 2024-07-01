6.27 <Firebase를 이용한 핸드폰 웹호스팅 도전>

문제 : firebase가 기본적으로 제공하는 호스팅은 정적인 웹서비스는 구현 가능하지만, 동적인 웹서비스는 구현하지 못한다고 함.

해결 : firebase function(유료)을 이용해야 함. / 금전적인 부분이라 구현하기가 힘듦.

6.28 <코드를 간소화 하던 과정중 ID가 숫자 2자리 됐을때 인식 못했던 현상>

문제 : 
<코드>
// 읍면 사이드바 클릭 시 이벤트 처리
const ymList = Array.from({ length: 16 }, (_, i) => `ym0${i + 1}`);
ymList.forEach(ym => {
  const ymElement = document.getElementById(ym);
  if (ymElement) {
    ymElement.onclick = () => {
      console.log(`Clicked: ${ym}`);
      makeWFSSource(ym);
    };
  } else {
    console.error(`Element not found: ${ym}`);
  }
});
위 코드를 실행했을 때 ym01~09까지는 잘 되고, 10~16이 Element not found 오류가 남

해결 : 
<코드>
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
위 코드와 같이 두 자리 숫자의 패딩 문제를 해결하기 위해 String(i + 1).padStart(2, '0')을 사용하여 2자리 문자열을 보장함.

6.28 <앞으로의 구성>

필지를 선택하면 값을 입력할 수 있도록 하고,
그 값이 데이터베이스에 입력이 되고(수정, 삭제, 갱신도 가능),
그 입력된 값에 따라 색상이 변경적용되는 기능을 만들것!

7.1 <연속지적도에 지표 값 넣기>

필지를 선택하여 지표값을 넣을 수 있도록 함.

문제 : jj 테이블에 sub1~sub15 컬럼을 int로 생성하였는데, 오류가 남

해결 : jsp에 값을 불러올 때 String으로 가져온 것을 int로 가져오고, select가 아닌 다른 구문은 result 값을 int로 받아야 되고, executeUpdate 구문을 써야됨을 인지하여 해결함

* 연속지적도에 지표값을 넣을 수 있도록 했는데, 입력 / 수정 / 삭제 중에 .. 입력은 말 그대로 기준없이 지표값만 DB에 넣는거라 아무 의미없이 DB의 객체 갯수만 늘어나는 거라 필요없고, 삭제는 해당 필지를 삭제하는거라 주의해야됨, 연속지적도 필지에서 사용할것은 수정기능!!
