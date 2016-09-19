/* globals $ */
/* eslint-env node, dirigible */

var md_headers = require('sample_master_detail/md_header_lib');
var request = require("net/http/request");
var response = require("net/http/response");
var xss = require("utils/xss");

handleRequest();

function handleRequest() {
	
	response.setContentType("application/json; charset=UTF-8");
	response.setCharacterEncoding("UTF-8");
	
	//get primary keys (one primary key is supported!)
	var idParameter = md_headers.getPrimaryKey();
	
	// retrieve the id as parameter if exist 
	var id = xss.escapeSql(request.getParameter(idParameter)) || request.getAttribute("path");
	var count = xss.escapeSql(request.getParameter('count'));
	var metadata = xss.escapeSql(request.getParameter('metadata'));
	//use getParameterMap for paramters wihtout value (implicit = true) metdata, count, expanded, cascaded
	var expanded = xss.escapeSql(request.getParameter('expanded'));
	var cascaded = xss.escapeSql(request.getParameter('cascaded'));

	if(checkConflictingParameters(id, count, metadata)){
		var limit = xss.escapeSql(request.getParameter('limit'));
		if (limit === null) {
			limit = 100;
		}
		var offset = xss.escapeSql(request.getParameter('offset'));
		if (offset === null) {
			offset = 0;
		}
		
		var sort = xss.escapeSql(request.getParameter('sort'));
		var order = xss.escapeSql(request.getParameter('order'));
		
		var urlParameters =  {
			"id": id,
			"metadata": (metadata!==null),
			"count": (count!==null),
			"list" : {
				"limit": limit,
				"offset": offset,
				"sort": sort,	
				"order": order			
			},
			"expanded": (expanded!==null),
			"cascaded": (cascaded!==null)
		};
		md_headers.http.dispatch(urlParameters);	
	}
	
	// flush and close the response
	response.flush();
	response.close();
}

function checkConflictingParameters(id, count, metadata) {
    if(id !== null && count !== null ){
    	md_headers.http.printError(response.EXPECTATION_FAILED, 1, "Expectation failed: conflicting parameters - id, count");
        return false;
    }
    if(id !== null && metadata !== null){
    	md_headers.http.printError(response.EXPECTATION_FAILED, 2, "Expectation failed: conflicting parameters - id, metadata");
        return false;
    }
    return true;
}
