<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" import="java.sql.*" %>
<%
    String id = request.getParameter("id");
    int sub8 = Integer.parseInt(request.getParameter("sub8"));
    int sub9 = Integer.parseInt(request.getParameter("sub9"));
    int sub10 = Integer.parseInt(request.getParameter("sub10"));
    int sub11 = Integer.parseInt(request.getParameter("sub11"));
    int sub12 = Integer.parseInt(request.getParameter("sub12"));
    int sub13 = Integer.parseInt(request.getParameter("sub13"));
    int sub14 = sub8 + sub9 + sub10 + sub11 + sub12 + sub13;
%>
<% 	// 접속할 DBMS 주소 		
    String url = "jdbc:postgresql://172.30.0.7/jinju";
    
    // DBMS의 사용자 이름
    String user = "scott";
    
    // 위 사용자 이름에 대한 비밀번호.
    String pwd = "tiger";
    
    // 연결을 위한 변수 
    Connection con = null;
    
    // 쿼리를 실행하는 Statement 변수
    PreparedStatement pstmt = null;
    
    // 시도한다. 이 try {} 안에서 실행을 시도하다가 문제가 생기면 catch {} 로 간다.
    try
    {
        // postgresql JDBC를 읽어들인다(로드한다 = 메모리에 올려 사용할 준비를 한다).
        Class.forName("org.postgresql.Driver");
        
        // DBMS와 연결한다. url: 접속할 서버. user: DBMS 사용자 계정, pwd: user의 비밀번호
        con = DriverManager.getConnection(url, user, pwd);
        
        // 실행할 쿼리문 			
        String query = "update make set sub8 = '" + sub8 + "', sub9 = '" + sub9 + "', sub10 = '" + sub10 + "', sub11 = '" + sub11 + "', sub12 = '" + sub12 + "', sub13 = '" + sub13 + "', sub14 = '" + sub14 + "' WHERE id = " + id;

        // DBMS에 쿼리할 준비를 한다.
        pstmt = con.prepareStatement(query);
                
        // select 쿼리를 실행한다. 검색 결과가 rs에 담긴다.
        int result = pstmt.executeUpdate();
                    
        // 자료가 1개 밖에 없는 게 확실하니 while이 아닌 if를 쓴다.
        if (result > 0) {
            out.println("데이터를 수정했습니다");
        } else {
            out.println("데이터 수정에 실패했습니다");
        } 			

        // 쿼리 실행기를 닫는다.
        pstmt.close();
        
        // 연결을 닫는다.
        con.close();
    }		
    catch(Exception ex)		// 위 try{} 에서 문제가 발생하면 이 안으로 들어온다.
    {
        // 만약 try 안의 내용을 실행하는 중에 에러가 발생하면 그 에러 내용을 보여준다.
        out.println("err: " + ex.toString());
    }
%>