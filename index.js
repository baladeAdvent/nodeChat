var express = require('express');
var http = require('http');
var sio = require('socket.io');

var server = express.createServer();

var port =  3000 || process.env.PORT;

server.listen(port);
var io = sio.listen(server);

server.get('/',fucntion(request, response){
	res.sendFile(__dirname + '/index.html');
});

io.socket.on('connection',function(socket){
	console.log('Connection on: ' + port);
});