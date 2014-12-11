process.title = 'node-chat';

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var chatLog = new Array();
var userList = new Array();
app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

// create empty container for data to be sent
mdata = {};

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});

wss.on("connection", function(ws){
	
	//console.log(ws);
	console.log('websocket connection open');
	//var id = setInterval(function() {
	//	ws.send({"keepalive"})
	//	}, 5000);
	/////////////
	
	ws.onmessage = function(event){
		var data = parseData(event.data);
		console.log(data);
		switch(data['type']){
			case 'ping':
				console.log('ping from user:' + data['username'] );
				break;
				
			case 'chat message':
				mdata = {
					'type': 'chat message',
					'username': data['username'],
					'message': data['message']
				}
				chatLog.push(mdata);
				ws.send(stringify(mdata));
				break;
				
			case 'log request':
				console.log('Log request');
				for(x in chatLog){				
					mdata = {
						'type': 'log message',
						'username': chatLog[x]['username'],
						'message': chatLog[x]['message']
					}
					ws.send(stringify(mdata));
				}
				break;
				
			case 'disconnect':
				mdata = {
					'type': 'system message',
					'username': data['username'],
					'message': ' has disconnected from the chat...'
				}
				chatLog.push(mdata);
				ws.send(stringify(mdata));
				break;
		}
	};
	
	/////////////
	ws.on("close", function(){
		console.log('websocket connection closed');
		//clearInterval(id);
	});
});

function stringify(obj){
	output = '';
	for(x in obj){
		output += x + '~:~' + obj[x] + '}:}';
	}
	return output.replace(/}:}$/,'');
}

function parseData(str){
	var Obj = [];
	
	var array1 =  str.split('}:}');
	for(x in array1){
		parts = array1[x].split('~:~');
		if(parts[0] != ''){
			Obj[parts[0]] = parts[1];
		}
	}
	return Obj
}