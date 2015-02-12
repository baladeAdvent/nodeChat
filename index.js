process.title = 'node-chat';

var __SYSTEM_COLOR = '255,30,30';
var __USERNAME_LENGTH = 16;

var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var app = express();
var port = (process.env.PORT || 5000);

var chatLog = new Array();
var clients = new Array();

var channels = new Array(
	{
		'id':0,
		'name':'Lobby',
		'topic':'Welcome to nodeChat Lobby!',
		'pass':false
	},
	{
		'id':1,
		'name':'Chatroom1',
		'topic':'Somewhere to go that isn\'t the lobby...',
		'pass':false
	}
);

var clientID = 0;
app.use(express.static(__dirname + '/'));

var conCheck = setInterval(function(){
	checkConnections();
},1000);

var server = http.createServer(app);
server.listen(port,function(){});
console.log("http server listening on %d", port);
var wss = new WebSocketServer({server: server});

var mongo = require('./mongo_lib.js');
mongo.init('nodechatsystem','nodechat123456nodechat','nodechattest',function(err){
	if(err){
		console.log(err);
	}

	wss.on("connection", function(ws){
		var index = clientID++;
		var userObj = {
			'id': index,
			'username': 'new_user' + Math.floor(Math.random() * 10000),
			'channel':0,
			'ws': ws,
			'active': false,
			'textColor': randomColor()
		};
		clients.push(userObj);
		
		ws.onmessage = function(event){
			var data = JSON.parse(event.data);
			console.log(data);
			switch(data.type){
				
				//* Name Availability Checks *//
				case 'USER_CHECK_LOGIN_AVAILABILITY':
				case 'USER_CHECK_REGISTRATION_AVAILABILITY':
					checkNameAvailability(data.type,data.username,ws);
					break;

				//* Registration Request Handling *//
				case 'USER_REQUEST_REGISTRATION':
					registerNewUser(data,ws);
					break;
				
				//* Login Request Handling *//
				case 'USER_REQUEST_LOGIN_ANONYMOUS':
				case 'USER_REQUEST_LOGIN_VERIFY':
					loginNewUser(data,ws,index);
					break;
					
				case 'USER_LOGIN_RECONNECT':
					loginReconnectUser(data,ws,index);
					break;
					
				//* CHAT Handling *//
				case 'USER_REQUEST_CHAT_LOG':
					sendChatlog(ws,getUserChannel(index));
					break;
					
				case 'USER_REQUEST_USER_LIST':
					sendUserList(ws);
					break;
					
				case 'USER_PUBLIC_CHAT_MESSAGE':
					processChatMessage(index,data);
					break;
					
				case 'USER_REQUEST_UPDATE_COLOR':
					setUserColor(index,data.color);
					break;
				
				//* Channel List Request *//
				case 'USER_REQUEST_CHANNEL_LIST':
					sendChannelList(ws);
					break;
				
				//* Search Handling *//
				case 'USER_REQUEST_SEARCH':
					processSearch(data.request,ws);
					break;
					
				//* Chat Statistics *//
				case 'USER_REQUEST_CHAT_STATISTICS':
					processChatStatistics(ws);
					break;
					
				//* Heart beat *//
				case 'USER_HEARTBEAT':
					returnHeartbeat(ws);
					break;

			}

		};
		
		/////////////
		ws.onclose(function(event){
			// Cannot get this event to trip... wth?
			console.log('Close event detected for client(' + index + ')');
		});
	});	
	
});


//////////////////////////////////////////
// Login functions
//////////////////////////////////////////
function loginNewUser(data,connection,index){
	var obj = {
		type: (data.type).replace('USER','SYSTEM').replace('REQUEST','RESPONSE'),
		time: (new Date()).getTime(),
		result: '',
		username: processUserName(data.name),
		password: data.password,
		channel: channels[data.channel],
		textColor: getUserColor(index),
		message: ''
	};

	// If user supplied password verify login authenticity
	if(data.type == 'USER_REQUEST_LOGIN_VERIFY'){
		mongo.verifyUser(data.name,data.password,function(err,res){
			if(res == true){ // If credentials are good log user in
				obj.result = 'success';
				processLogin(data,index);
			}else{	// If credential fail deny and notify
				obj.result = 'failed';
				obj.message = 'Invalid login credentials...';
			}
			sendToOne(connection,obj);
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
				obj.message = 'Username is registered, please choo choo choose another...';
			}else{	// If username is not log user in
				obj.result = 'success';
				processLogin(data,index);
			}
			sendToOne(connection,obj);			
		});
			
			
	}
}

function processLogin(data,index){
	// Disconnect any other user using this userName
	for(x in clients){
		if(clients[x]['username'] == data.name){			
			var obj = {
				'time': (new Date()).getTime(),
				'type': 'SYSTEM_MESSAGE',
				'username': 'System',
				'message': 'Another user has logged in using this login',
				'textColor': __SYSTEM_COLOR	,
			};
			connection = clients[x]['ws'];
			sendToOne(connection,obj);
			connection.close();
		}
	}
	// Update username
	setUserName(index,data.name);
	// Set Client Channel
	setChannel(index,data.channel);
	// Set Client to active
	setActive(index);
	// Send login notice to all active clients
	systemNotice( data.name + ' has logged in...' );
	sendUserList();
}

//////////////////////////////////////////
// Reconnect functions
//////////////////////////////////////////
function loginReconnectUser(data,connection,index){
	var obj = {
		type: 'SYSTEM_RECONNECT_RESPONSE',
		result: '',
		message: ''
	};
	
	mongo.isNameReserved(data.name,function(res){
		if(res == true){
			// If username is reserved, revalidate login
			mongo.verifyUser(data.name,data.password,function(err,res){
				if(res === true){
					// If verification passed...
					obj.result = 'success';
					processReconnect(data,index);
				}else{
					// If verification failed...
					obj.result = 'failed';
					obj.message = 'Invalid login credentials...';
				}
				sendToOne(connection,obj);
			});
		}else{
			// If username is not reserved allow login...
			obj.result = 'success';
			obj.message = 'whatever...';
			processReconnect(data,index);
		}
	});

}

function processReconnect(data,index){
	//console.log(clients);
	// Disconnect any other user using this userName
	for(x in clients){
		if(clients[x]['username'] == data.name){
			//console.log('Disconnect This:');
			//console.log(clients[x]);
			var obj = {
				'time': (new Date()).getTime(),
				'type': 'SYSTEM_FORCE_DISCONNECT',
				'username': 'System',
				'message': 'Another user has logged in using this login',
				'textColor': __SYSTEM_COLOR	,
			};
			connection = clients[x]['ws'];
			sendToOne(connection,obj);
			connection.close();
		}
	}
	// Update username
	setUserName(index,data.name);
	// Update text color
	setUserColor(index, data.color);
	// Set Client Channel
	setChannel(index,data.channel);
	// Set Client to active
	setActive(index);
	// Send login notice to all active clients
	systemNotice( data.name + ' has reconnected...' );
	sendUserList();
}

//////////////////////////////////////////
// Channel list
//////////////////////////////////////////
function sendChannelList(connection){
		var obj = {
			'type':'SYSTEM_RESPONSE_CHANNEL_LIST',
			'channelist':channels			
		};
		sendToOne(connection,obj);	
}

//////////////////////////////////////////
// Registration functions
//////////////////////////////////////////
function registerNewUser(data,connection){
	newUser = {
		'type': 'user',
		'username': data.name,
		'password': data.password,
		'email': data.email,
		'session':''
	};
	mongo.registernewUser(newUser,function(err,res){
		//console.log('mongo.registernewUser returned: ' + res);
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
		sendToOne(connection,obj);
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
		
		var obj = {
			'time': (new Date()).getTime(),
			'type': type.replace('USER','SYSTEM'),
			'available': nameAvailability
		};
		sendToOne(connection,obj);
	});	
}

//////////////////////////////////////////
// Chat Functions
//////////////////////////////////////////
function sendChatlog(connection,channel){
	var sendThis = new Array();
	for(x in chatLog){
		if(chatLog[x].channel == channel){
			sendThis.push(chatLog[x]);
		}
	}
	sendThis = sendThis.slice(-15);
	
	var obj = {
		'time': (new Date()).getTime(),
		'type': 'SYSTEM_RESPONSE_CHAT_LOG',
		'channel':channel,
		'chatlog': sendThis
	};
	sendToOne(connection,obj);
}
function systemNotice(msg,channel){
	//console.log('systemNotice("' + msg + '")');
	var obj = {
		'time': (new Date()).getTime(),
		'type': 'SYSTEM_MESSAGE',
		'channel':channel,
		'message': msg,
		'textColor': __SYSTEM_COLOR
	};
	sendToAll(obj);
}


function processChatMessage(id,data){
		//console.log('processChatMessage(): ' + id);
		//console.log(data);
		
		var obj = {
			'time': (new Date()).getTime(),
			'type': 'SYSTEM_RESPONSE_CHAT_MESSAGE',
			'username': getUserName(id),
			'message': cleanString(data.message),
			'channel': data.channel,
			'textColor': getUserColor(id)	
		};
		
		addToChatLog(obj);
		sendToAll(obj);
		mongo.addToChatLog(obj,function(res){
			if(res == true){
				console.log('message added to log');
			}else{
				console.log('error occured while adding message to log');
			}
		});
}

//////////////////////////////////////////
// Search Functions
//////////////////////////////////////////
function processSearch(searchTerms,connection){
	mongo.searchMessage(searchTerms,function(err,results){
		if(err){
			console.log(err);
		}else{
			//console.log(results.length);
			var obj = {
				'type': 'SYSTEM_RESPONSE_SEARCH_RESULTS',
				'results': results
			};
			sendToOne(connection,obj);
		}
	});
}

//////////////////////////////////////////
// Chat Statistics
//////////////////////////////////////////
function processChatStatistics(connection){
	console.log('Calculate word useage...');
		mongo.chatWordUsage(function(err,wordUseArray){
			//console.log(err);
			console.log(wordUseArray);
			var obj = {
				'type': 'SYSTEM_RESPONSE_CHAT_STATISTICS_WORDUSAGE',
				'wordUseage': wordUseArray
			};
			sendToOne(connection,obj);
		});
}

//////////////////////////////////////////
// User Setters
//////////////////////////////////////////
function setUserName(index,userName){
	//console.log('setUsername(' + index + ')');
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['username'] = userName;
		}
	}
}
function setChannel(index,channel){
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['channel'] = channel;
		}
	}
}
function setUserColor(index,color){
	//console.log('setUserColor(' + color + ') - ' + getUserName(index));
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['textColor'] = color;
		}
	}
}
function setActive(index){
	//console.log('setActive(' + index + ')');
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['active'] = true;
		}
	}
}
function setInactive(index){
	//console.log('setInactive(' + index + ')');
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['active'] = false;
		}
	}
}
function setSession(index,session){
	//console.log('setSession(' + index + ')');
	for(x in clients){
		if(clients[x]['id'] == index){
			clients[x]['session'] = session;
		}
	}
}

//////////////////////////////////////////
// User Getters
//////////////////////////////////////////
function getUserName(id){
	for(x in clients){
			if(clients[x]['id'] == id){
				return clients[x]['username'];
			}
	}
	return 'Default_Username';
}
function getUserColor(id){
	for(x in clients){
		if(clients[x]['id'] == id){
			console.log(clients[x]);
			return clients[x]['textColor'];
		}
	}
	return '0,0,0';
}
function getUserChannel(id){
	for(x in clients){
		if(clients[x]['id'] == id){
			console.log('User is in channel:' + x);
			return clients[x]['channel'];
		}
	}
	return 0;	
}

//////////////////////////////////////////
// Utility
//////////////////////////////////////////
function cleanString(msg){
	// Trim empty space
	str = trim(msg);
	//strip html carets
	str = htmlentities(str);
	// Process 'bbCode'
	// Return final chat entry
	return str;
}
function addToChatLog(obj){
	chatLog.push(obj);
}

//////////////////////////////////////////
// Broadcasting
//////////////////////////////////////////
function sendToAll(data){
	for(i=0;i<clients.length;i++){
		if(typeof clients[i]['ws'] != 'undefined' && clients[i]['ws']['readyState'] == '1'){
			//console.log("broadcast to: " + clients[i]['username']);
			var connection = clients[i]['ws']; 
			connection.send(JSON.stringify(data));
		}
	}
}
function sendToOne(connection, obj){
		if(connection.readyState == '1'){
				connection.send(JSON.stringify(obj));
		}
}
function returnHeartbeat(connection){
	if(connection.readyState == '1'){
		connection.send(JSON.stringify({'type':'SYSTEM_HEARTBEAT'}));
	}
}

//////////////////////////////////////////
// Client clean up
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
		sendUserList();
		sendUpdate = false;
	}
}
function removeClient(index){
	oldLength = clients.length;
	var username = '';
	for(i=0;i<clients.length;i++){
		//console.log('searching through clients:' + i + '....');
		if(clients[i].id == index){
			//console.log('Client found at:' + i);
			username = clients[i].username;
			activeStatus = clients[i].active;
			
			clients.splice(i,1);
			
			if(activeStatus == true){
				systemNotice(username + ' has logged out...');
				setInactive(index);
			}
		}
	}
	console.log('Remove client by id:' + index + ' - length: o' + oldLength + '/n' + clients.length);
}

//////////////////////////////////////////
function sendUserList(connection){
	var obj = {
		'time': (new Date()).getTime(),
		'type': 'SYSTEM_UPDATE_USER_LIST',
		'userlist': getUserList()
	};
	
	if(connection == null){
		//console.log('sendUserList(): Update All');
		sendToAll(obj); 
	}else{
		//console.log('sendUserList(): Update One');
		sendToOne(connection,obj);
	}
	
}
//////////////////////////////////////////
function getUserList(){
	output = new Array();
	for(i=0;i<clients.length;i++){
		if(typeof clients[i]['ws'] != 'undefined' && clients[i]['ws']['readyState'] == '1' && clients[i].active === true){
			output.push({
				'name': clients[i]['username'],
				'textColor': clients[i]['textColor']
			});
		}
	}
	output.sort();
	return output;
}

//////////////////////////////
function processUserName(name){
	// Trim empty space
	name = trim(name);

	// Remove non-english characters and carets
	pattern = /[^a-zA-Z0-9.' ]/g;
	name = name.replace(pattern,'');
	
	// Replace spaces with underscores
	pattern = /[ ]{1,}/g;
	name = name.replace(pattern,'_');
	
	// Trim username to acceptable length if its too long
	if(name.length > __USERNAME_LENGTH){
		name = name.substr(0,__USERNAME_LENGTH);
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
	//console.log('RGB: ' + randomRGB);
	return randomRGB;
}

// Delete this if you cant find a use for it somehow...
//////////////////////////////
function generateUUID(){
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	});
	return uuid;
};