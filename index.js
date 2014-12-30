process.title = 'node-chat';

var systemColor = '255,255,255';

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
	var index = clientID++;
	
	var userObj = {
		'id': index,
		'username': 'new_user' + Math.floor(Math.random() * 1001),
		'ws': ws,
		'active': false,
		'textColor': randomColor()
	};
	clients.push(userObj);
		
	ws.onmessage = function(event){
		var data = JSON.parse(event.data);
		switch(data['type']){
				
			case 'login':
				userName = checkUsername(data['username']);
				setUserName(index,userName);
				noticeUserLogin(userName);
				// update user lists
				sendUpdatedUserList();
				break;
			
			case 'chat message':
				mdata = {
					'time': (new Date()).getTime(),
					'type': 'chat message',
					'username': data['username'],
					'message': htmlentities(trim(data['message'])),
					'color': getUserColor(index)
				}
				chatLog.push(mdata);
				broadcast(mdata);
				break;
				
			case 'log request':
				for(x in chatLog){				
					mdata = {
						'time': chatLog[x]['time'],
						'type': 'log message',
						'username': chatLog[x]['username'],
						'message': chatLog[x]['message'],
						'color': chatLog[x]['color']
					}
					ws.send(JSON.stringify(mdata));
				}
				break;
				
			case 'ping':

				break;
		}
	};
	
	/////////////
	ws.onclose(function(event){
		// Cannot get this event to trip... wth?
	});
});
//////////////////////////////////////////
function setUserName(index,userName){
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['username'] = userName;
			clients[x]['active'] = true;
		}
	}
}
//////////////////////////////////////////
function broadcast(data){
	for(i=0;i<clients.length;i++){
		console.log("broadcast to: " + clients[i]);
		for(x in clients[i]){
			console.log('client has property: ' + x);
		}
		
		if(typeof clients[i]['ws'] != 'undefined' && clients[i]['ws']['readyState'] == '1'){
			var conn = clients[i]['ws']; 
			conn.send(JSON.stringify(data));
		}
	}
}
//////////////////////////////////////////
function checkConnections(){
	var sendUpdate = false;
	for(i=0;i<clients.length;i++){
		var id = i;
		
		if('undefined' != typeof clients[i]['ws'] && clients[i]['ws']['readyState'] == '3'){
			removeClient(clients[i].id);
			sendUpdate = true;
		}
	}
	if(sendUpdate === true){
		sendUpdatedUserList();
		sendUpdate = false;
	}
}
//////////////////////////////////////////
function removeClient(index){
	oldLength = clients.length;
	var username = '';
	for(i=0;i<clients.length;i++){
		console.log('searching through clients:' + i + '....');
		if(clients[i].id == index){
			console.log('Client found:' + i);
			username = clients[i].username;
			if(clients[i].active == true){
				noticeUserLogout(username);
			}
			clients.splice(i,1);
		}
	}
	console.log('Remove client by id:' + index + ' - length: o' + oldLength + '/n' + clients.length);
}
//////////////////////////////////////////
function sendUpdatedUserList(){
	mdata = {
		'time': (new Date()).getTime(),
		'type': 'update userlist',
		'username': 'System',
		'userlist': get_userList(),
		'color': systemColor
	};
	for(i=0;i<clients.length;i++){
		if('undefined' != typeof clients[i]['ws'] && clients[i]['ws']['readyState'] == '1' && clients[i]['active'] == true){
			var conn = clients[i]['ws']; 
			conn.send(JSON.stringify(mdata));
		}
	}
}
//////////////////////////////////////////
function get_userList(){
	output = new Array();
	for(i=0;i<clients.length;i++){
		if(typeof clients[i]['ws'] != 'undefined' && clients[i]['ws']['readyState'] == '1'){
			output.push({
				'name': clients[i]['username'],
				'color': clients[i]['textColor']
			});
		}
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
		'message': username + ' has logged in...',
		'color': systemColor
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
		'message': username + ' has logged out...',
		'color': systemColor
	};
	chatLog.push(mdata);
	broadcast(mdata);
}
//////////////////////////////
function checkUsername(name){
	name = cleanString(trim(name));
	for(x in clients){
		if(clients[x]['username'] == name){
			name = name + '_' + Math.floor(Math.random() * 1001);
		}
	}
	return name;
}
//////////////////////////////
function trim(str){
	var pattern = /^( ){1,}|( ){1,}$/;
	return str.replace(pattern,'');
}
//////////////////////////////
function cleanString(str){
	var pattern = /( ){1,}/;
	return str.replace(pattern,'_');
}
//////////////////////////////
function htmlentities(str){
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
//////////////////////////////
function randomColor(){
	var r = Math.floor((Math.random() * 255) + 1);
	var g = Math.floor((Math.random() * 255) + 1);
	var b = Math.floor((Math.random() * 255) + 1);
	
	randomRGB = r + ',' + g + ',' + b;
	console.log('RGB: ' + randomRGB);
	return randomRGB;
}
//////////////////////////////
function getUserColor(index){
	for(x in clients){
		if( clients[x]['id'] == index ){
			return clients[x]['textColor'];
		}
	}
	return '0,0,0';
}