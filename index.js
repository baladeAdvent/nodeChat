var express = require('express');

var app = express();
var http = require('http');
var server = http.createServer(app);

var sio = require('socket.io');
var port = (process.env.PORT || 5000);

server.listen(port);
var io = sio.listen(server);
	io.set('transports', ['xhr-polling']);
	io.set('polling duration', 10);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.lg('User Connected');
});