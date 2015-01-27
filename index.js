process.title = 'node-chat';

var __SYSTEM_COLOR = '255,255,255';
var __USERNAME_LENGTH = 16;

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var mongo = require('./mongo_lib.js');

//var MongoClient = require('mongodb').MongoClient;
//	MongoClient.connect("mongodb://nodechatsystem:nodechat123456nodechat@ds031661.mongolab.com:31661/nodechattest",function(err, db){
//		if(!err) {
//			console.log("Connected to MongoDB");
//		}else{
//			console.log("Unable to connect to MongoDB");
//		}
//	});

var chatLog = new Array();
var clients = new Array();
var channels = new Array();
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
		'username': 'new_user' + Math.floor(Math.random() * 10000),
		'ws': ws,
		'active': false,
		'textColor': randomColor()
	};
	clients.push(userObj);
		
	ws.onmessage = function(event){
		var data = JSON.parse(event.data);
		switch(data['type']){
			
			//* Name Availability Checks *//
			case 'USER_CHECK_LOGIN_AVAILABILITY':
			case 'USER_CHECK_REGISTRATION_AVAILABILITY':
				checkNameAvailability(data['type'],data['username'],ws);
				break;

			//* Registration Request Handling *//
			case 'USER_REQUEST_REGISTRATION':
				registerNewUser(data,ws);
				break;
			
			//* Login Request Handling *//
			case 'USER_REQUEST_LOGIN_ANONYMOUS':
			case 'USER_REQUEST_LOGIN_VERIFY':
				console.log(data);
				loginNewUser(data['type'],data,ws,index);
				break;
/*			
			case 'USER_LOGIN':
				userName = processUserName(data['username']);
				setUserName(index,userName);
				noticeUserLogin(userName);
				// update user lists
				sendUpdatedUserList();
				break;
			
			case 'USER_PUBLIC_MESSAGE':
				mdata = {
					'time': (new Date()).getTime(),
					'type': 'CHAT_MESSAGE',
					'username': data['username'],
					'message': processChatMessage(data['message']),
					'color': getUserColor(index)
				}
				chatLog.push(mdata);
				broadcast(mdata);
				break;
				
			case 'USER_LOG_REQUEST':
				for(x in chatLog){				
					mdata = {
						'time': chatLog[x]['time'],
						'type': 'LOG_MESSAGE',
						'username': chatLog[x]['username'],
						'message': chatLog[x]['message'],
						'color': chatLog[x]['color']
					}
					ws.send(JSON.stringify(mdata));
				}
				break;
			
			case 'UPDATE_USER_TEXTCOLOR':
				console.log('processing color change for user: ' + data['username'] + ':' + data['value']);
				setUserTextColor(data['username'],data['value']);
				sendUpdatedUserList();
				break;
*/
		}

	};
	
	/////////////
	ws.onclose(function(event){
		// Cannot get this event to trip... wth?
	});
});

//////////////////////////////////////////
// Login functions
//////////////////////////////////////////
function loginNewUser(type,data,connection,index){
	obj = {
		type: type.replace('USER','SYSTEM').replace('REQUEST','RESPONSE'),
		time: (new Date()).getTime(),
		result: '',
		username: data.name
	};

	// If user supplied password verify login authenticity
	if(type == 'USER_REQUEST_LOGIN_VERIFY'){
		mongo.verifyUser(data.name,data.password,function(err,res){
			if(res == true){ // If credentials are good log user in
				processLogin(type,data.name,index);
				obj.result = 'success';
			}else{	// If credential fail deny and notify
				obj.result = 'failed';
			}
			connection.send(JSON.stringify(obj));
		});
		
	}else{ // If user logged in anonymously
		nameAvailable = true;
		
		mongo.isNameReserved(data.name,function(res){			
			if(res == true){
				nameAvailable = false;
			}
			for(x in clients){// Check if username is in-use/registered
				if(clients[x]['username'] == data.name){
					nameAvailable = false;
				}
			}
			
			if(nameAvailable == false){ // If username is in-use/registered deny login attempt and notify
				obj.result = 'failed';
			}else{	// If username is not log user in
				obj.result = 'success';
				processLogin(type,name,index);
			}
			connection.send(JSON.stringify(obj));			
		});
			
			
	}
}

function processLogin(type,name,index){
	// Disconnect any other user using this userName
	for(x in clients){
		if(clients[x]['username'] == name){			
			obj = {
				'time': (new Date()).getTime(),
				'type': 'SYSTEM_MESSAGE',
				'username': 'System',
				'message': 'Another user has logged in using this login',
				'color': __SYSTEM_COLOR	
			};
			connection.send(JSON.stringify(obj));
			connection.close();
		}
	}
	
	// Update username
	setUserName(index,name);

	// set Client to active
	setActive(index);
}

//////////////////////////////////////////
// Registration functions
//////////////////////////////////////////
function registerNewUser(data,connection){
	newUser = {
		'type': 'user',
		'username': data.name,
		'password': data.password,
		'email': data.email
	};
	mongo.registernewUser(newUser,function(err,res){
		console.log('mongo.registernewUser returned: ' + res);
		if(res != null){
				var obj = {
					time: (new Date()).getTime(),
					type:'SYSTEM_REGISTRATION_RESPONSE',
					result: 'success',
					username: newUser.username
				};
		}else{
				var obj = {
					time: (new Date()).getTime(),
					type:'SYSTEM_REGISTRATION_RESPONSE',
					result: 'failed',
					username: newUser.username,
					error: err
				};
		}
		connection.send(JSON.stringify(obj));
	});
}
function checkNameAvailability(type,name,connection){
	// True if name is available
	// False if name is in use
	nameAvailability = 'true';
	for(x in clients){
		if(clients[x]['username'] == name){
			nameAvailability = 'false';
		}
	}
	mongo.checkUsername(name,function(ret){
		if(ret == 'true'){
			nameAvailability = 'false';
		}
		
		mdata = {
			'time': (new Date()).getTime(),
			'type': type.replace('USER','SYSTEM'),
			'available': nameAvailability
		};
		connection.send( JSON.stringify(mdata) );
	});	
}

//////////////////////////////////////////
function setUserName(index,userName){
	console.log('setUsername(' + index + ')');
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['username'] = userName;
		}
	}
}
function setActive(index){
	console.log('setActive(' + index + ')');
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['active'] = true;
		}
	}
}


//////////////////////////////////////////
function setUserTextColor(name,color){
	for(x in clients){
		console.log(clients[x]['username'] + ' : ' + name);
		if(clients[x]['username'] == name){
			clients[x]['textColor'] = color;
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
			activeStatus = clients[i].active;
			
			clients.splice(i,1);
			
			if(activeStatus == true){
				noticeUserLogout(username);
			}
		}
	}
	console.log('Remove client by id:' + index + ' - length: o' + oldLength + '/n' + clients.length);
}
//////////////////////////////////////////
function sendUpdatedUserList(){
	mdata = {
		'time': (new Date()).getTime(),
		'type': 'UPDATE_USERLIST',
		'username': 'System',
		'userlist': get_userList(),
		'color': __SYSTEM_COLOR
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
		'type': 'SYSTEM_MESSAGE',
		'username': 'System',
		'message': username + ' has logged in...',
		'color': __SYSTEM_COLOR
	};
	chatLog.push(mdata);
	broadcast(mdata);
}
//////////////////////////////////////////
function noticeUserLogout(username){
	mdata = {
		'time': (new Date()).getTime(),
		'type': 'SYSTEM_MESSAGE',
		'username': 'System',
		'message': username + ' has logged out...',
		'color': __SYSTEM_COLOR
	};
	chatLog.push(mdata);
	broadcast(mdata);
}

//////////////////////////////
function processChatMessage(str){
	// Trim empty space
	str = trim(str);
	//strip html carets
	str = htmlentities(str);
	
	// Process 'bbCode'
	
	// Return final chat entry
	return str;
}

//////////////////////////////
function processUserName(name){
	// Trim empty space
	name = trim(name);

	// Remove non-english characters and carets
	pattern = /[^a-zA-Z0-9.' ]/g;
	name = name.replace(pattern,'');
	
	// Replace spaces with underscored
	pattern = /[ ]{1,}/g;
	name = name.replace(pattern,'_');
	
	// Trim username to acceptable length if its too long
	if(name.length > __USERNAME_LENGTH){
		name = name.substr(0,__USERNAME_LENGTH);
	}
	
	// Check if username is already in use
	for(x in clients){
		if(clients[x]['username'] == name){	// If username is in use, append suffixes
			name = name + '_' + Math.floor(Math.random() * 1001);
		}
	}

	// return processed name
	return name;
}

//////////////////////////////
function trim(str){
	var pattern = /^( ){1,}|( ){1,}$/;
	return str.replace(pattern,'');
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