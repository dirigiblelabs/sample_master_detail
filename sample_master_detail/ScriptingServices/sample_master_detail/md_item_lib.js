/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");

var datasource = database.getDatasource();

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(item) {

	if(item === undefined || item === null){
		throw new Error('Illegal argument: item is ' + item);
	}
	
	if(item.mdi_mdh_id === undefined || item.mdi_mdh_id === null){
		throw new Error('Illegal mdi_mdh_id attribute: ' + item.mdi_mdh_id);
	}	
	
	if(item.mdi_name === undefined || item.mdi_name === null){
		throw new Error('Illegal mdi_name attribute: ' + item.mdi_name);
	}	
	
    var connection = datasource.getConnection();
    try {
       var sql = "INSERT INTO MD_ITEM (";
        sql += "MDI_ID";
        sql += ",";
        sql += "MDI_MDH_ID";
        sql += ",";
        sql += "MDI_NAME";
        sql += ",";
        sql += "MDI_DESCRIPTION";
        sql += ") VALUES ("; 
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ")";

        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);
        
        var i = 0;
        var id = datasource.getSequence('MD_ITEM_MDI_ID').next();
        
        statement.setInt(++i, id);
        statement.setInt(++i, item.mdi_mdh_id);
        statement.setString(++i, item.mdi_name);
        statement.setString(++i, item.mdi_description);
        statement.executeUpdate();

        return id;
        
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    return -1;
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id) {
    var connection = datasource.getConnection();
    try {
        var item;
        var sql = "SELECT * FROM MD_ITEM WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            item = createEntity(resultSet);
        } 
        return item;
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Read all entities, parse and return them as an array of JSON objets
exports.list = function(headerId, limit, offset, sort, desc) {
    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT ";
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM MD_ITEM";
        if(headerId !== null && headerId !== undefined){
        	sql += " WHERE MDI_MDH_ID=" + headerId;
        }
        if (sort !== null && sort !== undefined) {
            sql += " ORDER BY " + sort;
        }
        if ((sort !== null && sort !== undefined) && (desc !== null && desc !== undefined)) {
            sql += " DESC ";
        }
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }
        
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
            items.push(createEntity(resultSet));
        }
        return items;
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet) {
    var result = {};
	result.mdi_id = resultSet.getInt("MDI_ID");
	result.mdi_mdh_id = resultSet.getInt("MDI_MDH_ID");
    result.mdi_name = resultSet.getString("MDI_NAME");
    result.mdi_description = resultSet.getString("MDI_DESCRIPTION");
    console.info(">>> " + result);
    return result;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
    if(item){
    	if(!item.mdi_description)
    		item.mdi_description = null;
		//perform any transofrmations here
	}
	console.info("<<< " + item);
	return item;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(item) {

	if(item === undefined || item === null){
		throw new Error('Illegal argument: item is ' + item);
	}
	
	if(item.mdi_id === undefined || item.mdi_id === null){
		throw new Error('Illegal mdi_id attribute: ' + item.mdi_id);
	}	
	
	if(item.mdi_mdh_id === undefined || item.mdi_mdh_id === null){
		throw new Error('Illegal mdi_mdh_id attribute: ' + item.mdi_mdh_id);
	}	
	
	if(item.mdi_name === undefined || item.mdi_name === null){
		throw new Error('Illegal mdi_name attribute: ' + item.mdi_name);
	}	

    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE MD_ITEM SET ";
        sql += "MDI_MDH_ID = ?";
        sql += ",";
        sql += "MDI_NAME = ?";
        sql += ",";
        sql += "MDI_DESCRIPTION = ?";
        sql += " WHERE MDI_ID = ?";
        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);

        var i = 0;
        statement.setInt(++i, item.mdi_mdh_id);
        statement.setString(++i, item.mdi_name);
        statement.setString(++i, item.mdi_description);
        var id = item.mdi_id;
        statement.setInt(++i, id);
        statement.executeUpdate(); 
        
        return id;
        
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// delete entity by id. Returns the id of the deleted entity.
exports.remove = function(id) {
    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM MD_ITEM WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        return id;
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};


exports.count = function() {
    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM MD_ITEM';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    return count;
};

exports.metadata = function() {
	var entityMetadata = {
		name: 'md_item',
		type: 'object',
		properties: []
	};
	
	var propertymdi_id = {
		name: 'mdi_id',
		type: 'integer',
	key: 'true',
	required: 'true'
	};
    entityMetadata.properties.push(propertymdi_id);

	var propertymdi_mdh_id = {
		name: 'mdi_mdh_id',
		type: 'integer'
	};
    entityMetadata.properties.push(propertymdi_mdh_id);

	var propertymdi_name = {
		name: 'mdi_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertymdi_name);

	var propertymdi_description = {
		name: 'mdi_description',
		type: 'string'
	};
    entityMetadata.properties.push(propertymdi_description);

	return JSON.stringify(entityMetadata);

};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'MDI_ID';
    if (result === 0) {
        throw new Error("There is no primary key");
    } else if(result.length > 1) {
        throw new Error("More than one Primary Key is not supported.");
    }
    return result;
};

exports.getPrimaryKey = function() {
	return exports.getPrimaryKeys()[0].toLowerCase();
};

exports.pkToSQL = function() {
    var pks = exports.getPrimaryKeys();
    return pks[0] + " = ?";
};

exports.http = {

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		if('POST' === method){
			this.create();
		} else if('PUT' === method){
			this.update();
		} else if('DELETE' === method){
			this.remove(urlParameters.id);
		} else if('GET' === method){
			if(urlParameters){
				if(urlParameters.id){
					this.get(urlParameters.id);
				} else if(urlParameters.metadata){
					this.metadata();
				} else if(urlParameters.count){
					this.count();
				} else if(urlParameters.list){
					this.query(urlParameters.list.headerId, urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.desc);
				}
			} else {
				this.query();
			}
		} else {
			this.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}

	}, 

	create: function(){
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item.mdi_id = exports.insert(item);
			response.setStatus(response.OK);
			response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + item.mdi_id);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	update: function() {
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item.mdi_id = exports.update(item);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	remove: function(id) {
	    try{
			exports.remove(id);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	get: function(id){
		//id is mandatory parameter and an integer
		if(id === undefined || isNaN(parseInt(id))) {
			this.printError(response.BAD_REQUEST, 1, "Invallid id parameter: " + id);
		}

	    try{
			var item = exports.find(id);
			if(!item){
        		this.printError(response.NOT_FOUND, 1, "Record with id: " + id + " does not exist.");
			}
			var jsonResponse = JSON.stringify(item, null, 2);
	        response.println(jsonResponse);        	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	query: function(headerId, limit, offset, sort, desc){
		if (headerId === undefined) {
			headerId = null;
		}
		if (offset === undefined || offset === null) {
			offset = 0;
		} else if(isNaN(parseInt(offset)) || offset<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
		}

		if (limit === undefined || limit === null) {
			limit = 0;
		}  else if(isNaN(parseInt(limit)) || limit<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
		}
		if (sort === undefined) {
			sort = null;
		} 
		if (desc === undefined) {
			desc = null;
		} else if(desc!==null){
			if(sort === null){
				this.printError(response.BAD_REQUEST, 1, "Parameter desc is invalid without paramter sort to order by.");
			} else if(desc.toLowerCase()!=='desc' || desc.toLowerCase()!=='asc'){
				this.printError(response.BAD_REQUEST, 1, "Invallid desc parameter: " + desc + ". Must be either ASC or DESC.");
			}
		}
	    try{
			var items = exports.list(headerId, limit, offset, sort, desc);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	count: function(){
	    try{
			var itemsCount = exports.count();
			response.setHeader("Content-Type", "text/plain");
	    	response.println(itemsCount);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	metadata: function(){
 		try{
			var entityMetadata = exports.metadata();
			response.setHeader("Content-Type", "application/json");
			response.println(entityMetadata);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;        	
		}		
	},
	
	printError: function(httpCode, errCode, errMessage, errContext) {
	    var body = {'err': {'code': errCode, 'message': errMessage}};
	    response.setStatus(httpCode);
	    response.setHeader("Content-Type", "application/json");
	    response.print(JSON.stringify(body));
	    console.error(JSON.stringify(body));
	    if (errContext !== null) {
	    	console.error(JSON.stringify(errContext));
	    }
	}
	
};
