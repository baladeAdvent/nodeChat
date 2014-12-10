process.title = 'node-chat';

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log('websocket server created');

wss.on("connection", function(ws){
	console.log('websocket connection open');
	// var id = setInterval(function() {
	//	ws.send(JSON.stringify(new Date()), function() { })
	//	}, 1000);
	/////////////
	
	ws.onmessage = function(event){
		console.log(event);
		ws.send(event.data);
	};
	
	/////////////
	ws.on("close", function(){
		console.log('websocket connection closed');
		//clearInterval(id);
	});
});