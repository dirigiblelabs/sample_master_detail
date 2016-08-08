/* globals $ */
/* eslint-env node, dirigible */

var database = require("db/database");
var mdItems = require("sample_master_detail/md_item_lib");

/* required for the exports.http module only */
var request = require("net/http/request");
var response = require("net/http/response");

var datasource = database.getDatasource();

var itemsEntitySetName = "items";

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(entity, cascaded) {

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}

	if(entity.mdh_name === undefined || entity.mdh_name === null){
		throw new Error('Illegal mdh_name attribute: ' + entity.mdh_name);
	}

	if(cascaded === undefined || cascaded === null){
		cascaded = false;
	}

    entity = createSQLEntity(entity);

    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO MD_HEADER (";
        sql += "MDH_ID";
        sql += ",";
        sql += "MDH_DESCRIPTION";
        sql += ",";
        sql += "MDH_NAME";
        sql += ") VALUES ("; 
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ")";

        var statement = connection.prepareStatement(sql);
        
        var i = 0;
        entity.mdh_id = datasource.getSequence('MD_HEADER_MDH_ID').next();
        
        statement.setInt(++i, entity.mdh_id);
        statement.setString(++i, entity.mdh_description);
        statement.setString(++i, entity.mdh_name);
        
        statement.executeUpdate();
	
		if(cascaded){
			if(entity[itemsEntitySetName] && entity[itemsEntitySetName].length > 0){
	        	for(var j=0; j<entity[itemsEntitySetName].length; j++){
	        		var item = entity[itemsEntitySetName][j];
	        		item.mdi_mdh_id = entity.mdh_id;
					mdItems.insert(item);
	    		}
	    	}
		}

        return entity.mdh_id;
        
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
        var sql = "SELECT * FROM MD_HEADER WHERE " + exports.pkToSQL();
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
exports.list = function(limit, offset, sort, desc, expanded) {
    var connection = datasource.getConnection();
    try {
        var entities = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM MD_HEADER";
        if (sort !== null) {
            sql += " ORDER BY " + sort;
        }
        if (sort !== null && desc !== null) {
            sql += " DESC ";
        }
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	var entity = createEntity(resultSet);
        	if(expanded !== null && expanded!==undefined){
			   var dependentEntities = mdItems.list(entity.mdh_id, null, null, null, null);
			   if(dependentEntities) {
			   	 entity["items"] = dependentEntities;
		   	   }
			}
            entities.push(entity);
        }
        return entities;
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
	result.mdh_id = resultSet.getInt("MDH_ID");
	result.mdh_description = resultSet.getString("MDH_DESCRIPTION");
    result.mdh_name = resultSet.getString("MDH_NAME");
    return result;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
    if(item){
    	//implement any required JSON-to-SQL transformations here
	}
	return item;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(entity, cascaded) {

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}
	
	if(entity.mdh_id === undefined || entity.mdh_id === null){
		throw new Error('Illegal mdh_id attribute: ' + entity.mdh_id);
	}

	if(entity.mdh_name === undefined || entity.mdh_name === null){
		throw new Error('Illegal mdh_name attribute: ' + entity.mdh_name);
	}
	
	if(cascaded === undefined || cascaded === null){
		cascaded = false;
	}

    var connection = datasource.getConnection();
    try {
    
        var sql = "UPDATE MD_HEADER SET ";
        sql += "MDH_DESCRIPTION = ?";
        sql += ",";
        sql += "MDH_NAME = ?";
        sql += " WHERE MDH_ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setString(++i, entity.mdh_description);
        statement.setString(++i, entity.mdh_name);
        var id = entity.mdh_id;
        statement.setInt(++i, id);
        statement.executeUpdate();    

		if(cascaded){
			
			if(entity[itemsEntitySetName] && entity[itemsEntitySetName].length > 0){

				var persistedItems = mdItems.list(entity.mdh_id);
	
				for(var k=0; k < persistedItems.length; k++) {
					var itemToUpdate;					
				   	for(var j=0; j < entity[itemsEntitySetName].length; j++){
				   		
		        		var item = entity[itemsEntitySetName][j];
		        		if(persistedItems.mdi_id === item.mdi_id){
		        			itemToUpdate = item;
	        			}

		    		}

		    		if(!itemToUpdate){
	        			mdItems.remove(persistedItems[k].mdi_id);
	    			} else if(item.mdi_id){
	        			mdItems.update(itemToUpdate);
        			} else {
	        			item.mdi_mdh_id = entity.mdh_id;
	        			mdItems.insert(itemToUpdate);
    				}	        				
		    		
				}
			
	    	}
		}
    	
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
    	var sql = "DELETE FROM MD_HEADER WHERE " + exports.pkToSQL();
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
    	var sql = 'SELECT COUNT(*) FROM MD_HEADER';
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
		name: 'md_header',
		type: 'object',
		properties: []
	};
	
	var propertymdh_id = {
		name: 'mdh_id',
		type: 'integer',
		key: 'true',
		required: 'true'
	};
    entityMetadata.properties.push(propertymdh_id);

	var propertymdh_description = {
		name: 'mdh_description',
		type: 'string'
	};
    entityMetadata.properties.push(propertymdh_description);

	var propertymdh_name = {
		name: 'mdh_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertymdh_name);

	return JSON.stringify(entityMetadata);

};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'MDH_ID';
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

	idPropertyName: 'mdh_id',
	validSortPropertyNames: ['mdh_id','mdh_name','mdh_description'],

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		if('POST' === method){
			this.create(urlParameters.cascaded);
		} else if('PUT' === method){
			this.update(urlParameters.cascaded);
		} else if('DELETE' === method){
			this.remove(urlParameters.id, urlParameters.cascaded);
		} else if('GET' === method){
			if(urlParameters){
				if(urlParameters.id){
					this.get(urlParameters.id, urlParameters.expanded);
				} else if(urlParameters.metadata){
					this.metadata();
				} else if(urlParameters.count){
					this.count();
				} else if(urlParameters.list){
					this.query(urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.desc, urlParameters.expanded);
				}
			} else {
				this.query();
			}
		} else {
			this.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}
	}, 

	create: function(cascaded){
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item[this.idPropertyName] = exports.insert(item, cascaded);
			response.setStatus(response.OK);
			response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + item[this.idPropertyName]);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	update: function(cascaded) {
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item[this.idPropertyName] = exports.update(item, cascaded);
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
        		return;
			}
			var jsonResponse = JSON.stringify(item, null, 2);
	        response.println(jsonResponse);        	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	query: function(limit, offset, sort, desc, expanded){
		if (offset === undefined || offset === null) {
			offset = 0;
		} else if(isNaN(parseInt(offset)) || offset<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
			return;
		}

		if (limit === undefined || limit === null) {
			limit = 0;
		}  else if(isNaN(parseInt(limit)) || limit<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
			return;
		}
		if (sort === undefined) {
			sort = null;
		} else if( sort !== null && this.validSortPropertyNames.indexOf(sort)<0){
			this.printError(response.BAD_REQUEST, 1, "Invalid sort by property name: " + sort);
			return;
		}

		if (desc === undefined) {
			desc = null;
		} else if(desc!==null){
			if(sort === null){
				this.printError(response.BAD_REQUEST, 1, "Parameter desc is invalid without paramter sort to order by.");
				return;
			} else if(desc.toLowerCase()!=='desc' || desc.toLowerCase()!=='asc'){
				this.printError(response.BAD_REQUEST, 1, "Invallid desc parameter: " + desc + ". Must be either ASC or DESC.");
				return;
			}
		}
		if(expanded === undefined || expanded === false){
			expanded = null;
		}

	    try{
			var items = exports.list(limit, offset, sort, desc, expanded);
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
