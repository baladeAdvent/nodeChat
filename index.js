var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

app.use(express.static(__dirname + '/');

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log()'websocket server created';

wss.on("connection", function(ws){
	console.log('websocket connection open');
	
	ws.on("close", function(){
		console.log('websocket connection closed');
	});
});

/*
var sio = require('socket.io');


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
*/