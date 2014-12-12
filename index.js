process.title = 'node-chat';

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var chatLog = new Array();
var clients = [];
app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port,function(){});

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});

wss.on("connection", function(ws){
	console.log('websocket connection open');
	
	ws.on('request',function(requst){
		var connection = request.accept(null,request.origin);
		clients.push(connection);
	});
	
	ws.onmessage = function(event){
	console.log(event);
		var data = parseData(event.data);
		switch(data['type']){
				
			case 'login':
				mdata = {
					'type': 'system message',
					'username': 'System',
					'message': data['username'] + ' has logged in...'
				}
				chatLog.push(mdata);
				ws.send(stringify(mdata));
				break;
			
			case 'chat message':
				mdata = {
					'type': 'chat message',
					'username': data['username'],
					'message': data['message']
				}
				chatLog.push(mdata);
				for(i=0;i<clients.length;i++){
					clients[i].send(stringify(mdata));
					console.log(clients[i]);
				}
				
				break;
				
			case 'log request':
				console.log('Log request');
				for(x in chatLog){				
					mdata = {
						'type': 'log message',
						'username': chatLog[x]['username'],
						'message': chatLog[x]['message']
					}
					ws.send(stringify(mdata), function(){},1000);
				}
				break;

			case 'ping':
				console.log('ping from user:' + data['username'] );
				break;
		}
	};
	
	/////////////
	ws.on("close", function(event){
		console.log('websocket connection closed ' + event);
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
	var array1 = str.split('}:}');
	for(x in array1){
		parts = array1[x].split('~:~');
		if(parts[0] != ''){
			Obj[parts[0]] = parts[1];
		}
	}
	return Obj;
}