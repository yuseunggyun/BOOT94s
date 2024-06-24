6.24 검색창 만들기(1)

새로운 jsp(search.jsp)를 생성하여 ID를 검색했을 때 그 해당되는 내용을 먼저 표현하고 싶음

문제점 : id가 int로 되어있어 코드를 String이 아닌 int로 가져와야했음

해결 : int queryInt = Integer.parseInt(query.trim()); 코드를 통해 값을 int로 바꿔줌
