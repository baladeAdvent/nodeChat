// mongo_lib.js
var MongoClient = require('mongodb').MongoClient;
var exports = module.exports = {};

var MONGO_USER = 'nodechatsystem';
var MONGO_PASS = 'nodechat123456nodechat';
var MONGO_DB = 'nodechattest';

exports.open = function(){
	MongoClient.connect("mongodb://" + MONGO_USER + ":" + MONGO_PASS + "@ds031661.mongolab.com:31661/" + MONGO_DB ,function(err, db){
		if(!err) {
			console.log("Connected to MongoDB");
		}else{
			console.log("Unable to connect to MongoDB");
		}
		
		var collection = db.collection('users');
		collection.findOne({'username':'admin'},function(err,item){
		console.log(item);
		});
		
	});
}

exports.checkUsername = function(name){
	MongoClient.connect("mongodb://" + MONGO_USER + ":" + MONGO_PASS + "@ds031661.mongolab.com:31661/" + MONGO_DB ,function(err, db){
		if(!err) {
			return false;
		}
		
		var collection = db.collection('users');
		collection.findOne({'username':name},function(err,item){
		console.log(item);
		});
		
	});
}