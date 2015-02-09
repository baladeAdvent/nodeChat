// mongo_lib.js
var MongoClient = require('mongodb').MongoClient;
var exports = module.exports = {};

var DB = null;
var MONGO_USER = '';
var MONGO_PASS = '';
var MONGO_DB = '';

exports.init = function(user,pass,database,callback){
	MongoClient.connect("mongodb://" + user + ":" + pass + "@ds031661.mongolab.com:31661/" + database ,function(err, db){
		if(err){
			callback(err);
		}
		DB = db;
		callback();
	});	
}

/* Search functions */
exports.searchMessage = function(requestString,callback){
	//console.log('searchMessage(): ' + requestString);
	DB.collection('chatlog',function(err,docs){
		if(err){
			callback(err,null);
		}	
		docs.find({ $text: { $search: requestString}},function(err,cursor){			
			if(err){
				callback(err,null);
			}	
			cursor.sort({time: -1}).toArray(callback);
		});
	});
}

/* Chat Statistics */
exports.chatWordUsage = function(callback){

	var collection = DB.collection('chatlog');
	
	collection.find().toArray(function(err,result){
		console.log('collection count: '+result.length);
	});
	
	var map = function(){ 
		emit(this.message,1); 
	};
	
	var reduce = function(val,k){ 
		
		return {k:val};
	};
	
	collection.mapReduce( map,reduce,{ out: {replace:"tempCollection"} },function(err,res){
		res.find().toArray(function(err,result){			
			console.log('mapReduce count:' + result.length);
			console.log(result);	
		});
	});

}

exports.checkUsername = function(name,callback){
	//console.log('Check Username:' + name);
	status = 'default';
	
	var collection = DB.collection('users');
	collection.findOne({'username':name},function(err,item){
		if(item == null){
			//console.log(name + ': Not found in collection');
			status = 'false';
		}else{
			//console.log(name + ': Found in collection');
			status = 'true';	
		}
		callback(status);
	});

}



/* Logging */
exports.addToChatLog = function(doc,callback){
	//console.log('Mongo: Add message to chatlog DB');
	status = true;
	
	var collection = DB.collection('chatlog');
	collection.insert(doc,{w:1},function(err,res){
		if(res == null){
			callback(false);
		}else{
			callback(true);
		}
	});
}

exports.isNameReserved = function(name,callback){
	//console.log('Mongo: Check if username is available');
	status = true;
		
	var collection = DB.collection('users');
	collection.findOne({'username':name},function(err,item){
		if(item == null){
			//console.log(name + ': Not found in collection');
			status = false;
		}else{
			//console.log(name + ': Found in collection');
			status = true;	
		}
		callback(status);
	});

}

exports.verifyUser = function(name, pass, callback){
	//console.log('Mongo: Verifying user credentials: ' + name + '/' + pass);
	var collection = DB.collection('users');
	collection.findOne({ $and:[{'username':name},{'password':pass}]},function(err,item){
		//console.log('Mongo: findOne / '+item);
		if(item == null){
			callback(err,false);
		}else{
			callback(err,true);
		}
	});
}

exports.registernewUser = function (doc,callback){
	//console.log('Mongo: Registering new user...');
	var collection = DB.collection('users');
	collection.findOne({ $or:[{'username':doc.username},{'email':doc.email}]},function(err,item){
		if(item == null){
			collection.insert(doc,{w:1},function(err,returned_doc){
				callback(true,returned_doc);
			});
		}else{
			callback(err,null);
		}
	});
}