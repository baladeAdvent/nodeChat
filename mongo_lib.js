// mongo_lib.js

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect("mongodb://<dbuser>:<dbpassword>@ds031661.mongolab.com:31661/nodechattest",function(err, db){
	if(!err) {
		console.log("Connected to MongoDB");
	}
});

var exports = module.exports = {};

exports.open = function(){

}