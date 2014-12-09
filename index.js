var express = require('express');
var http = require('http');
var sio = require('socket.io');
var app = express();
var p = (process.env.PORT || 5000);

app.get('/', function(request, response){
	response.sendFile(__dirname + '/index.html');
});

var server = app.listen(p, function(){
	var host = server.address().address;
	var port = server.address().port;
	
	console.log('Example app listening at http://%s:%s', host, port);
});

