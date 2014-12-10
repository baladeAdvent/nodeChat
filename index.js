process.title = 'node-chat';

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var chatLog = [];
app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});

wss.on("connection", function(ws){
	
	for(x in chatLog){
		ws.send(chatLog[x]);
	}
	console.log('websocket connection open');
	// var id = setInterval(function() {
	//	ws.send(JSON.stringify(new Date()), function() { })
	//	}, 1000);
	/////////////
	
	ws.onmessage = function(event){
		chatLog[] = event.data;
		console.log(chatLog);
		ws.send(event.data);
	};
	
	/////////////
	ws.on("close", function(){
		console.log('websocket connection closed');
		//clearInterval(id);
	});
});