<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" import="java.sql.*" %>

<%
    String query = request.getParameter("query");
    if (query != null && !query.trim().isEmpty()) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        String url = "jdbc:postgresql://172.30.0.7/jinju";
        String user = "scott";
        String password = "tiger";

        try {
            Class.forName("org.postgresql.Driver");
            conn = DriverManager.getConnection(url, user, password);

            int queryInt = Integer.parseInt(query.trim());

            String sql = "SELECT * FROM jj WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setInt(1, queryInt);
            rs = pstmt.executeQuery();

            if (rs.next()) {
                out.println("<p>ID : " + rs.getString("id") + "</p>");
                out.println("<p>내용 : " + rs.getString("jinju_do_2") + "</p>");

            } else {

                out.println("<p> 검색 결과가 없습니다. </p>");
            }
        } catch (Exception e) {
            e.printStackTrace();

                out.println("<p> 에러 발생 : " + e.getMessage() + "</p>");

        } finally {
            try {
                if (rs != null) rs.close();
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
                out.println("<p>리소스 해제 중 에러 발생: " + e.getMessage() + "</p>");
            }
        }
    } else {
        out.println("<p>검색어를 입력하세요.</p>");
    }
%>