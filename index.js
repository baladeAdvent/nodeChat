process.title = 'node-chat';

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var chatLog = new Array();
var clients = new Array();
var clientID = 0;
app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port,function(){});

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});

wss.on("connection", function(ws){
	var index = clients.push(ws)-1;
	
	var userObj = {
		'id': index,
		'connection': ws,
		'username': false
	};
	clients[index] = userObj;
	
	ws.onmessage = function(event){
		console.log('Input from User:' + index + '(' + event + ')');
		//console.log(event);
		var data = JSON.parse(event.data);
		switch(data['type']){
				
			case 'login':
				mdata = {
					'time': (new Date()).getTime(),
					'type': 'system message',
					'username': 'System',
					'message': data['username'] + ' has logged in...'
				};
				userName = data['username'];
				clients[index]['username'] = userName;
				chatLog.push(mdata);
				broadcast(clients,mdata);
				
				// update user lists
				mdata = {
					'time': (new Date()).getTime(),
					'type': 'update userlist',
					'username': 'System',
					'userlist':get_userList(clients)
				};
				broadcast(clients,mdata);
				break;
			
			case 'chat message':
				mdata = {
					'time': (new Date()).getTime(),
					'type': 'chat message',
					'username': data['username'],
					'message': data['message']
				}
				chatLog.push(mdata);
				broadcast(clients,mdata);
				
				break;
				
			case 'log request':
				console.log('Log request');
				for(x in chatLog){				
					mdata = {
						'time': chatLog[x]['time'],
						'type': 'log message',
						'username': chatLog[x]['username'],
						'message': chatLog[x]['message']
					}
					ws.send(JSON.stringify(mdata));
				}
				break;

			case 'ping':
				console.log('ping from user:' + data['username']);
				break;
		}
	};
	
	/////////////
	ws.onclose(function(connection){
		console.log('websocket connection closed(' + index + ') ');
	});
});

function broadcast(arr,data){
	for(i=0;i<arr.length;i++){
		//console.log(arr[i]);
		var conn = arr[i]['connection']; 
		conn.send(JSON.stringify(data));
	}
}

function get_userList(arr){
	output = new Array();
	for(i=0;i<arr.length;i++){
		output.push(arr[i]['username']);
		//console.log('getUserlist: ('+i+')' + arr[i]['username']);
	}
	return JSON.stringify(output);
}

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