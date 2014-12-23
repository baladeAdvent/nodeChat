process.title = 'node-chat';

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var chatLog = new Array();
var clients = new Array();
var userNames = new Array();
var clientID = 0;
app.use(express.static(__dirname + '/'));

var conCheck = setInterval(function(){
	checkConnections();
},500);

var server = http.createServer(app);
server.listen(port,function(){});
console.log("http server listening on %d", port);
var wss = new WebSocketServer({server: server});

wss.on("connection", function(ws){
	var index = clients.push(ws)-1;
	
	var userObj = {
		'id': index,
		'username': 'user' + Math.floor(Math.random() * 1001),
		'connection': ws
	};
	clients[index] = userObj;
	
	console.log(clients);
	
	ws.onmessage = function(event){
		console.log('Input from User: (' + index + ')');
		var data = JSON.parse(event.data);
		switch(data['type']){
				
			case 'login':
				userName = data['username'];
				clients[index]['username'] = userName;
				noticeUserLogin(userName);
				// update user lists
				sendUpdatedUserList();
				break;
			
			case 'chat message':
				mdata = {
					'time': (new Date()).getTime(),
					'type': 'chat message',
					'username': data['username'],
					'message': data['message']
				}
				chatLog.push(mdata);
				broadcast(mdata);
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
	ws.onclose(function(event){
		var code = event.code;
		var reason = event.reason;
		var wasClean = event.wasClean;
		console.log('websocket connection closed(' + index + ') ' + code);
	});
});

//////////////////////////////////////////
function broadcast(data){
	for(i=0;i<clients.length;i++){
		if(clients[i] != false && clients[i]['connection']['readyState'] == '1'){
			var conn = clients[i]['connection']; 
			conn.send(JSON.stringify(data));
		}
	}
}
//////////////////////////////////////////
function checkConnections(){
	var sendUpdate = false;
	for(i=0;i<clients.length;i++){
		if(clients[i]['connection']['readyState'] == '3'){
			var id = i;
			
			console.log('client id: ' + i + clients[i]);
			//noticeUserLogout(clients[i]['username']);
			//clients.splice(i-1,1);
			//console.log('Remove from clients list ('+i+')');
			//sendUpdate = true;
		}
	}
	if(sendUpdate === true){
		sendUpdatedUserList();
		sendUpdate = false;
	}
}
//////////////////////////////////////////
//function unsetClients(index){
//	output = new Array();
//	for(x in clients){
//		console.log(x + ' : ' + index);
//		if(x != index){
//			output.push(clients[x]);
//		}
//	}
//	return output;
//}
//////////////////////////////////////////
function sendUpdatedUserList(){
	mdata = {
		'time': (new Date()).getTime(),
		'type': 'update userlist',
		'username': 'System',
		'userlist':get_userList()
	};
	for(i=0;i<clients.length;i++){
		if(clients[i] != false && clients[i]['connection']['readyState'] == '1'){
			var conn = clients[i]['connection']; 
			conn.send(JSON.stringify(mdata));
		}
	}
}
//////////////////////////////////////////
function get_userList(){
	output = new Array();
	for(i=0;i<clients.length;i++){
		if(clients[i] != false && clients[i]['connection']['readyState'] == '1'){
			output.push(clients[i]['username']);
		}
		console.log('getUserlist: ('+i+')' + clients[i]);
	}
	output.sort();
	return JSON.stringify(output);
}
//////////////////////////////////////////
function noticeUserLogin(username){
	mdata = {
		'time': (new Date()).getTime(),
		'type': 'system message',
		'username': 'System',
		'message': username + ' has logged in...'
	};
	chatLog.push(mdata);
	broadcast(mdata);
}
//////////////////////////////////////////
function noticeUserLogout(username){
	mdata = {
		'time': (new Date()).getTime(),
		'type': 'system message',
		'username': 'System',
		'message': username + ' has logged out...'
	};
	chatLog.push(mdata);
	broadcast(mdata);
}