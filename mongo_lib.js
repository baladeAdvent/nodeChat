// mongo_lib.js
var MongoClient = require('mongodb').MongoClient;
var exports = module.exports = {};

var MONGO_USER = 'nodechatsystem';
var MONGO_PASS = 'nodechat123456nodechat';
var MONGO_DB = 'nodechattest';

exports.checkUsername = function(name,callback){
	console.log('Check Username:' + name);
	status = 'default';
	MongoClient.connect("mongodb://" + MONGO_USER + ":" + MONGO_PASS + "@ds031661.mongolab.com:31661/" + MONGO_DB ,function(err, db){
		if(err) {
			status = 'false';
		}
		
		var collection = db.collection('users');
		collection.findOne({'username':name},function(err,item){
			if(item == null){
				console.log(name + ': Not found in collection');
				status = 'false';
			}else{
				console.log(name + ': Found in collection');
				status = 'true';
			}
			callback(status);
		});
	});
}

exports.registernewUser = function (doc,callback){
	console.log('Mongo: Registering new user...');
	MongoClient.connect("mongodb://" + MONGO_USER + ":" + MONGO_PASS + "@ds031661.mongolab.com:31661/" + MONGO_DB ,function(err, db){
		if(err) {
			callback(err,null,doc);
		}
		var collection = db.collection('users');
		collection.findOne({ $or:[{'username':doc.username},{'email':doc.email}]},function(err,item){
			if(item == null){
				collection.insert(doc,{w:1},function(err,returned_doc){
					callback(true,item,returned_doc);
				});
			}else{
				callback(err,null,doc);
			}
		});
	});
}