<%-- ExMobi JSP文件，注释和取消快捷键统一为Ctrl+/ 多行注释为Ctrl+Shift+/ --%>
<%@ page language="java" import="java.util.*"
 contentType="text/javascript; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/client/adapt.jsp"%>
<%
String type = request.getParameter("type");
String [] jqueryBaseAll = {"assets/third/jquery/jquery-2.1.3.min.js", "assets/third/jquery/jquery.mobile.custom.min.js", "assets/third/iscroll/iscroll-probe.js", "assets/third/arttemplate/template-native.js"};
String [] zeptoBaseAll = {"assets/third/zepto/zepto.min.js", "assets/third/iscroll/iscroll-probe.js", "assets/third/arttemplate/template-native.js"};
String [] listArray = "zeptoBaseAll".equals(type)?zeptoBaseAll:jqueryBaseAll;
%>
<%
Object merge = request.getSession().getAttribute("merge");
String content = merge==null?null:(String)merge;
if(content==null){
	content = "";
	for(int i=0;i<listArray.length;i++){
		String filePath = application.getRealPath("apps/agile_lite/server/jsp/www/"+listArray[i]);
		content += new String(aa.common.readBinaryFile(filePath),"UTF-8");
	}
	request.getSession().setAttribute("merge", content);
}
out.println(content);
%>