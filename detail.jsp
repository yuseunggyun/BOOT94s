<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" import="java.sql.*" %>
<%
    String id = request.getParameter("id");
%>
<%!
    // null 이라는 글자 대신 NO DATA라는 글자를 보여주는 함수
    public String checkNull(String data)
    {
        if (null == data)
            return "NO DATA";
        else
            return data;
    }
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
    Statement stmt = null;
    
    // 시도한다. 이 try {} 안에서 실행을 시도하다가 문제가 생기면 catch {} 로 간다.
    try
    {
        // postgresql JDBC를 읽어들인다(로드한다 = 메모리에 올려 사용할 준비를 한다).
        Class.forName("org.postgresql.Driver");
        
        // DBMS와 연결한다. url: 접속할 서버. user: DBMS 사용자 계정, pwd: user의 비밀번호
        con = DriverManager.getConnection(url, user, pwd);
        
        // DBMS에 쿼리할 준비를 한다.
        stmt = con.createStatement();
        // 실행할 쿼리문 			
        String query = "select * from jj where id= " + id ;
                
        // select 쿼리를 실행한다. 검색 결과가 rs에 담긴다.
        ResultSet rs = stmt.executeQuery(query);
                    
        // 자료가 1개 밖에 없는 게 확실하니 while이 아닌 if를 쓴다.
        if (rs.next())
        {
            out.println(rs.getString("pnu"));            
            out.println(rs.getString("jinju_do_1"));
            out.println(rs.getString("jinju_cada"));
            out.println(rs.getString("jinju_jibu"));
            out.println(rs.getString("jinju_ji_1"));
            out.println(rs.getString("jinju_area"));
            out.println(rs.getString("jinju_pric"));
            out.println(rs.getString("jinju_ow_1"));
            out.println(rs.getString("jinju_ch_1"));
            out.println(rs.getString("jinju_ch_2"));
        } 			
        
        // 검색결과를 담은 rs를 닫는다(검색결과를 담느라 사용했던 (대량의) 메모리 반환)
        rs.close();
        
        // 쿼리 실행기를 닫는다.
        stmt.close();
        
        // 연결을 닫는다.
        con.close();
    }		
    catch(Exception ex)		// 위 try{} 에서 문제가 발생하면 이 안으로 들어온다.
    {
        // 만약 try 안의 내용을 실행하는 중에 에러가 발생하면 그 에러 내용을 보여준다.
        out.println("err: " + ex.toString());
    }
%>