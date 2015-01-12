// mongo_lib.js
var MongoClient = require('mongodb').MongoClient;
var exports = module.exports = {};

var MONGO_USER = 'nodechatsystem';
var MONGO_PASS = 'nodechat123456nodechat';

exports.open = function(){
	MongoClient.connect("mongodb://" + MONGO_USER + ":" + MONGO_PASS + "@ds031661.mongolab.com:31661/nodechattest",function(err, db){
		if(!err) {
			console.log("Connected to MongoDB");
		}else{
			console.log("Unable to connect to MongoDB");
		}
	});
}