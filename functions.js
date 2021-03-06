var user = {
	'name':'',
	'channel':0,
	'textColor':''
};
var loggedIn = false;
var timestampStatus = false;
var autoscrollStatus = false;

var host = location.origin.replace(/^http/,'ws');
var ws = null;
createWebSocket();

// Reconnect
var reconnectInterval = null;
var reconnecting = false;

// Heartbeat
var	heartbeat_interval = null;
var missed_heartbeats = 0;		
		
// Update userlist
var userlist_interval = null;

$(document).ready(function(){	
	$('#nodeChat_login_password, #nodeChat_registration_button').prop('disabled',true);
	
	// Login button
	$('#nodeChat_login_button').click(function(evt){
		evt.preventDefault();
		validateLogin();
	});
	
	$('#nodeChat_search_submit').bind('click',function(){
		requestSearch();
	});
	
	$('#nodeChat_loginForm_register').bind('click',function(evt){
		$('#nodeChat_registerForm').animate({height:'toggle'},500);
	});
	
	$('#disconnect').bind('click',function(){
		ws.close();		
	});
	
	$('#nodeChat_statistics_word_useage button').bind('click',function(event){
		requestChatStatistics();
	});
	
	// Empty containers for timers
	loginCheck = '';
	registrationCheck = '';
	
	// - Login Username Check
	$('#nodeChat_login_username').bind('keypress change',function(){
		clearTimeout(loginCheck);
		if(trim($('#nodeChat_login_username').val()) != ''){
			loginCheck = setTimeout(function(){
				name = trim($('#nodeChat_login_username').val());
				var obj = {
					'type': 'USER_CHECK_LOGIN_AVAILABILITY',
					'username': name
					};
				
				checkAvailability(obj);
			},1000);
		}
	});
	// - Login Username Check
	
	// - Registration Username Check
	$('#nodeChat_register_username').bind('keypress change',function(){	
		$('#nodeChat_register_username_addon').find('i').attr('class','glyphicon glyphicon-search');			
		$('#nodeChat_registration_button').prop('disabled',true);
		clearTimeout(registrationCheck);
		if(trim($('#nodeChat_register_username').val()) != ''){
			registrationCheck = setTimeout(function(){
				name = trim($('#nodeChat_register_username').val());
				var obj = {
					'type': 'USER_CHECK_REGISTRATION_AVAILABILITY',
					'username': name
				};
				
				checkAvailability(obj);
			},1000);
		}
	});
	// - Registration Username Check
	
	// - Submit - //
	$('#sendToChat').click(function(evt){
		evt.preventDefault();
		processChatMessage(ws);
	});
	// - Submit - //
	
	// - Color Picker - //
	$('#textColor').ColorPicker({
		color: '#0000ff',
		onShow: function (colpkr) {
			$(colpkr).fadeIn(500).css('z-index',1000);
			return false;
		},
		onHide: function (colpkr) {
			$(colpkr).fadeOut(500);
			return false;
		},
		onChange: function (hsb, hex, rgb) {
			$('#textColor div').css('backgroundColor', '#' + hex);
		},
		onSubmit: function(hsb, hex, rgb, el){
			$('#textColor div').css('backgroundColor', '#' + hex);
			updateTextColor(rgb);
			$(el).ColorPickerHide();
		}
		
	});
	// - Color Picker - //
	
});

function createWebSocket(){
	ws = new WebSocket(host);

	///////////////////////////////////////////////////////////////////
	// WebSocket handling
	///////////////////////////////////////////////////////////////////
	ws.onopen = function(event){
		//Retrieve Channel List
		var obj = {
			'type':'USER_REQUEST_CHANNEL_LIST'
		}
		sendToServer(obj);
		
		console.log(event);
		// If reconnecting
		if(reconnecting == true){
			// Update new client entry to have my saved settings...?
			logProperties(user);
			
			var obj = {
				'type': 'USER_LOGIN_RECONNECT',
				'name': user.name,
				'password': user.password,
				'channel': user.channel,
				'textColor': user.textColor
			};
			sendToServer(obj);
		}else{
			console.log('Connected...');
		}			
		
		if (heartbeat_interval === null){
			missed_heartbeats = 0;
			heartbeat_interval = setInterval(function(){
				try {
					if(missed_heartbeats >= 3){
						throw new Error('ping timeout...');
					}
					ws.send(JSON.stringify({'type':'USER_HEARTBEAT'}));
				} catch(e) {
					clearInterval(heartbeat_interval);
					heartbeat_interval = null;
					appendSystemToChat(e.message,'255,30,30');
					ws.close();
				}
			},5000);
		}
	}

	// WS Response handling //
	ws.onmessage = function(event){		
		edata = JSON.parse(event.data);
		//logProperties(edata);
		switch(edata.type){
		
			// Login
			case 'SYSTEM_CHECK_LOGIN_AVAILABILITY':
				updateLoginButton(edata.available);
				break;
				
			case 'SYSTEM_RESPONSE_LOGIN_VERIFY':
			case 'SYSTEM_RESPONSE_LOGIN_ANONYMOUS':
				startNodeChat(edata);
				break;
				
			case 'SYSTEM_RECONNECT_RESPONSE':
				nodeChatReconnect(edata);
				break;
				
			case 'SYSTEM_FORCE_DISCONNECT':
				nodeChatDisconnect(edata);
				break;
			
			// Registration
			case 'SYSTEM_REGISTRATION_RESPONSE':
				registrationResponse(edata.result,edata.username);
				break;
				
			case 'SYSTEM_CHECK_REGISTRATION_AVAILABILITY':
				updateRegistrationButton(edata.available);
				break;
				
			// Chat
			case 'SYSTEM_MESSAGE':
				appendSystemToChat(edata.message,edata.textColor,edata.time);
				break;
				
			case 'SYSTEM_UPDATE_USER_LIST':
				updateUserlist(edata.userlist);
				break;
				
			case 'SYSTEM_RESPONSE_CHAT_LOG':
				appendChatLog(edata.chatlog);
				break;
				
			case 'SYSTEM_RESPONSE_CHAT_MESSAGE':
				appendToChat(edata.username,edata.message,edata.textColor,edata.time);
				break;
				
			// Channel List
			case 'SYSTEM_RESPONSE_CHANNEL_LIST':
				processChannelList(edata);
				break;
			
			// SEARCH
			case 'SYSTEM_RESPONSE_SEARCH_RESULTS':
				appendSearchResults(edata.results);
				break;
				
			// Chat Statistics
			case 'SYSTEM_RESPONSE_CHAT_STATISTICS_WORDUSAGE':
				postWordUseage(edata.wordUseage);
				break;
			
			// Heartbeat
			case 'SYSTEM_HEARTBEAT':
				missed_heartbeats = 0;
				break;
		}
	}
	// WS Response handling //
	
	/*
	ws.onerror = function(event){
		console.log('Reconnect on error');
		reconnecting = true;
		var intervalTime = ( Math.floor((Math.random() * 29) + 1) )*1000;
		console.log(intervalTime);
		setTimeout(function(){
			createWebSocket();
		},intervalTime);
	}
	*/
	
	ws.onclose = function(event){
		console.log('Reconnect on close');
		console.log(event);
		
		closeMessage = getCloseMessage(event.code);
		appendSystemToChat(closeMessage,'100,100,100');
		clearInterval(heartbeat_interval);
		clearInterval(userlist_interval);
		
		reconnecting = true;
		var intervalTime = ( Math.floor((Math.random() * 29) + 1) )*1000;
		console.log(intervalTime);
		reconnectInterval = setTimeout(function(){
			createWebSocket();
		},intervalTime);
	}
}

function getCloseMessage(code){
	messages = {
		1000: 'Disconnected...',
		1001: 'Server temporarily unavailable...',
		1002: 'Protocol Error...',
		1003: 'Unsupported data...',
		1005: 'Unexpected error...',
		1006: 'Adbnormal disconnect...',
		1007: 'Non-UTF-8 Data...',
		1008: 'Recieved a message which violates policy...',
		1009: 'Data too large...'
	};
	return messages[code];
}

///////////////////////////////////////////////////////////////////
// Login functions
///////////////////////////////////////////////////////////////////
	function updateLoginButton(nameStatus){
		usernameAddon = $('#nodeChat_login_username_addon').find('i');
		if(nameStatus == 'true'){
			// Set icon to ok, bind functions to register button
			usernameAddon.attr('class','glyphicon glyphicon-ok');
			$('#nodeChat_login_password').prop('disabled',true).val('');
		}else{
			// Set icon to unavailable, clear functions from register button
			usernameAddon.attr('class','glyphicon glyphicon-remove');
			$('#nodeChat_login_password').prop('disabled',false).val('');
		}
	}
	
	function validateLogin(){
		var errors = new Array();
		validationStatus = true;
		$('#nodeChat_loginForm input').each(function(index){
			if( trim($(this).val()) == '' && $(this).prop('disabled') == false){
				validationStatus = false;	
			}
		});

		if(validationStatus == false){
			message = $('<div></div>').attr('class','alert alert-danger').html('Please fill out all form fields to login');
			$('#nodeChat_loginResponse').clearQueue().html('').append( message ).hide().animate({height:'show'},500).delay(8000).animate({height:'hide'},500);
		}else{
			if( trim($('#nodeChat_login_password').val()) == ''){
				type = 'USER_REQUEST_LOGIN_ANONYMOUS';
			}else{
				type = 'USER_REQUEST_LOGIN_VERIFY';
			}
			var obj = {
				'type': type,
				'name':	trim($('#nodeChat_login_username').val()),
				'password': trim($('#nodeChat_login_password').val()),
				'channel': trim($('#nodeChat_login_channel').val())
			};
			// Note: Disable Login Form at this point, wait for response from server
			sendToServer(obj);
		}
	}
	
	function processChannelList(data){
		var option = $('<option></option>');
		var destination = $('#nodeChat_login_channel');
		
		for(i=0;i<data.channelist.length;i++){
			var name = data.channelist[i].name;
			var topic = data.channelist[i].topic;
			
			option.clone().text( name + ': ' + topic).val(i).appendTo(destination);
		}
		
	}
	
///////////////////////////////////////////////////////////////////
// Registration functions
///////////////////////////////////////////////////////////////////
	function registrationResponse(result,username){
		registrationForm = $('#nodeChat_registerForm');
		registerButton = $('#nodeChat_registration_button');
		message = $('<div></div>');
		if(result == 'success'){
			message.attr('class','alert alert-success').html('Success! The following username has been registered and is available for your use! : ' + username);
			registrationForm[0].reset();
			$('#nodeChat_registerForm').delay(2000).animate({height:'hide'},500);
		}else{
			message.attr('class','alert alert-danger').html('An error has occured while trying to register this username! Please try a different username or use a different email account. : ' + username);
			registerButton.prop('disabled',false);
		}
		$('#nodeChat_registrationResponse').clearQueue().html('').append( message ).hide().animate({height:'show'},500).delay(10000).animate({height:'hide'},500);
	}
	
	function updateRegistrationButton(nameStatus){
		usernameAddon = $('#nodeChat_register_username_addon').find('i');
		registerButton = $('#nodeChat_registration_button');
		if(nameStatus == 'true'){
			// Set icon to ok, bind functions to register button
			usernameAddon.attr('class','glyphicon glyphicon-ok');
			registerButton.prop('disabled',false);
			registerButton.click(function(evt){
				evt.preventDefault();
				validateRegistration();
			});
		}else{
			// Set icon to unavailable, clear functions from register button
			usernameAddon.attr('class','glyphicon glyphicon-remove');
			registerButton.prop('disabled',true);
			registerButton.click(function(evt){
				evt.preventDefault();
			});
		}
	}
	
	function validateRegistration(){
		errors = new Array();
		validationStatus = true;
		$('#nodeChat_registerForm input').each(function(index){
			//console.log($(this).attr('id') + ':' + trim($(this).val()));
			if($(this).attr('id') == 'nodeChat_register_email'){
				emailReg =/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)$/i;
				if(emailReg.test( trim($(this).val()) ) == false){
						validationStatus = false;
						errors.push('invalid email...');
				}
			}else{
				if( trim($(this).val()) == '' ){
					validationStatus = false;
					errors.push('missing input...');
				}
			}
		});

		if(validationStatus == false){
		message = $('<div></div>').attr('class','alert alert-danger').html(function(){
			output = '';
			for(i=0;i<errors.length;i++){
				output += "<div>" + errors[i] + "</div>";
			}
			return output;
		});
			 $('#nodeChat_registrationResponse').clearQueue().html('').append( message ).hide().animate({height:'show'},500).delay(5000).animate({height:'hide'},500);
		}else{
			var obj = {
				'type': 'USER_REQUEST_REGISTRATION',
				'name':	trim($('#nodeChat_register_username').val()),
				'password': trim($('#nodeChat_register_password').val()),
				'email': trim($('#nodeChat_register_email').val())
			};
			// Note: Disable Registration Form at this point, wait for response from server
			$('#nodeChat_registerForm button').prop('disabled',true);
			sendToServer(obj);
		}
	}

///////////////////////////////////////////////////////////////////
// Chat functions
///////////////////////////////////////////////////////////////////
	function startNodeChat(res){
		if(res.result == 'success'){
			user.name = res.username;
			user.textColor = res.textColor;
			user.password = res.password;
			user.channel = res.channel;
			user.session = res.session;
			
			logProperties(res.channel);
			
			updateTimestampStatus();
			$('#nodeChat_timestamp_toggle').bind('change',function(){
				updateTimestampStatus();
			});
			updateAutoscrollStatus();
			$('#nodeChat_autoscroll_toggle').bind('change',function(){
				updateTimestampStatus();
			});
			$('#nodeChat_message').bind('keypress',function(evt){
				if(evt.keyCode == 13){
					processChatMessage(ws);
				}
			});

			$('#nodeChat_login').animate({height:'hide'},500);
			$('#nodeChat_client').animate({height:'show'},500);
			
			$('#nodeChat_header').find('span').first().html(res.channel.name + ": " +res.channel.topic);
			$('#nodeChat_header').find('span').last().html(res.username);
			
			parts = (res.textColor).split(',');
			$('#textColor').ColorPickerSetColor({r:parts[0],g:parts[1],b:parts[2]});
			$('#textColor div').css('backgroundColor', 'rgb(' + res.textColor + ')');
			requestChatLog();
			requestUserlist();
		
			userlist_interval = setInterval(function(){
				requestUserlist();	
			},15000);
		}else{
			message = $('<div></div>').attr('class','alert alert-danger').text('Unable to login...' + res.message);
			$('#nodeChat_loginResponse').clearQueue().html('').append( message ).hide().animate({height:'show'},500).delay(8000).animate({height:'hide'},500);
		}
	}
	
	function nodeChatReconnect(data){
		if(data.type == "failed"){
			$('#nodeChat_login').animate({height:'show'},500);
			$('#nodeChat_client').animate({height:'hide'},500);
		}
	}
	
	function nodeChatDisconnect(data){
		clearTimeout(reconnectInterval);
		appendSystemToChat(data.message,'100,100,100',data.time);
	}
	
	function processChatMessage(){
		var message = $('#nodeChat_message').val();

		if( validateMessage(message) == true){
			var obj = {
				'type': 'USER_PUBLIC_CHAT_MESSAGE',
				'message': message,
				'channel': user.channel
			};
			sendToServer(obj);
			$('#nodeChat_message').val('');
		}
	}
	
	function updateTimestampStatus(){
		timestampStatus = $('#nodeChat_timestamp_toggle').prop('checked');
		if(timestampStatus == true){
			$('.nodeChat_timestamp').show(500);
		}else{
			$('.nodeChat_timestamp').hide(500);
		}
	}
	
	function updateAutoscrollStatus(){
			autoscrollStatus = $('#nodeChat_autoscroll_toggle').prop('checked');
			scrollChat();
	}
	
	// Requests
	function requestChatLog(){
		var obj = {
			'type': 'USER_REQUEST_CHAT_LOG'
		};
		sendToServer(obj);
	}
	function requestUserlist(){
		var obj = {
			'type': 'USER_REQUEST_USER_LIST'
		};
		sendToServer(obj);
	}

	// Utilities
	function appendChatLog(log){
			for(i=0;i<log.length;i++){
				var timeStamp = $('<div></div>').attr('class','nodeChat_timestamp').html( processDateTime(log[i].time) ).css('display',get_timeStamp_display());
				var label = $('<div></div>').css('color','rgb('+log[i].textColor+')').css('display','table-cell').text(log[i].username + ': ').append( timeStamp );
				var message = $('<div></div>').css('display','table-cell').text(log[i].message);
				var appendThis = $('<li></li>').attr('class','nodeChat_chat_message').append(label).append(message);
				$('#nodeChat_messages').append( appendThis.hide() );
				appendThis.animate({'height':'show'},500);
				scrollChat();
			}
	}
	
	function appendSystemToChat(message,color,time){
		var timeStamp = $('<div></div>').attr('class','nodeChat_timestamp').html( processDateTime(time) ).css('display',get_timeStamp_display());
		var label = $('<div></div>').css('color','rgb('+color+')').css('display','table-cell').css('padding-right','5px').text('SYSTEM: ').append( timeStamp );
		var message = $('<div></div>').css('display','table-cell').html(message);
		var appendThis = $('<li></li>').attr('class','nodeChat_system_message bg-info').append(label).append(message);
		$('#nodeChat_messages').append( appendThis.hide() );
		appendThis.animate({'height':'show'},500);
		scrollChat();
	}
	
	function appendToChat(username,message,color,time){
		var timeStamp = $('<div></div>').attr('class','nodeChat_timestamp').html( processDateTime(time) ).css('display',get_timeStamp_display());
		var label = $('<div></div>').css('color','rgb('+color+')').css('display','table-cell').css('padding-right','5px').text(username + ': ').append( timeStamp );
		var message = $('<div></div>').css('display','table-cell').html(message);
		var appendThis = $('<li></li>').attr('class','nodeChat_chat_message').append(label).append(message);
		$('#nodeChat_messages').append( appendThis.hide() );
		appendThis.animate({'height':'show'},500);
		scrollChat();		
	}
	
	function get_timeStamp_display(){
		if(timestampStatus == true){
				return 'block';
		}else{
				return 'none';
		}
	}

	function updateUserlist(data){
		var destination = $('#nodeChat_userlist');
			destination.html('');
		
		for(i=0;i<data.length;i++){
			logProperties(data[i]);
			var item = $('<li></li>').css('color','rgb('+data[i].textColor+')').html(data[i].name);
			destination.append( item );
		}
	}

	function checkAvailability(obj){
		//console.log('Check username availability');
		sendToServer(obj);
	}
	
	function updateTextColor(color){
		var obj = {
			'type': 'USER_REQUEST_UPDATE_COLOR',
			'color': color.r + ',' + color.g + ',' + color.b
		};
		user.textColor = color.r + ',' + color.g + ',' + color.b;
		sendToServer(obj);
	}

	function sendToServer(obj){
		//console.log('sendToServer()');
		//console.log(obj);
		ws.send(JSON.stringify(obj));
	}
	
	function scrollChat(){
		if(autoscrollStatus === true){
			el = $('#nodeChat_messages');
			height = el.prop('scrollHeight')+2;
			el.animate({ scrollTop:height},500);
		}
	}	

///////////////////////////////////////////////////////////////////
// Statistics
///////////////////////////////////////////////////////////////////
	function requestChatStatistics(){
			var obj = {
				type:'USER_REQUEST_CHAT_STATISTICS'
			};
			sendToServer(obj);
	}
	
	function requestSearch(){	
		var searchThis = $('#nodeChat_search_message').val();
		var destination = $('#nodeChat_search_response').html('');

		var row = $('<div></div>').attr('class','row').css('margin-top','5px');
		var col = $('<div></div>').attr('class','col-xs-12').html('<div class="bg-danger" style="padding:5px;">Search Results For: <em>' + searchThis + '</em></div>');
		row.append(col).appendTo(destination).animate({'height':'show'},1000);
		
		var obj = {
			'type': 'USER_REQUEST_SEARCH',
			'request': searchThis 
		};
		sendToServer(obj);	
	}
	
	function appendSearchResults(results){
		var destination = $('#nodeChat_search_response');
		var row = $('<div></div>').attr('class','row');
		var col = $('<div></div>');
		if(results.length > 0){
			for(i=0;i<results.length;i++){
				col.clone().attr('class','col-xs-1').html(i + ".").appendTo(row);
				col.clone().attr('class','col-xs-2').html(results[i].username).appendTo(row);
				col.clone().attr('class','col-xs-3').html( processDateTime(results[i].time) ).appendTo(row);
				col.clone().attr('class','col-xs-6').html(results[i].message).appendTo(row);
				row.appendTo(destination);
			}			
		}else{
				col.clone().attr('class','col-xs-12').html('No results found...').appendTo(row);
		}
		row.appendTo(destination);
	}
	
	function postWordUseage(data){
		//logProperties(data);
		
		destination = $('#nodeChat_statistics_word_useage > .results').html('');
		var row = $('<div></div>').attr('class','row');
		var col = $('<div></div>');
		
		for(i=0;i<data.length;i++){
			//logProperties(data[i].value);
			cell = row.clone();
			col.clone().attr('class','col-xs-3').html( i + '.').appendTo(cell);
			col.clone().attr('class','col-xs-3').html( data[i]._id ).appendTo(cell);
			col.clone().attr('class','col-xs-3').html( data[i].value.count ).appendTo(cell);
			col.clone().attr('class','col-xs-3').html( data[i].value.length ).appendTo(cell);
			cell.appendTo(destination);
		}
	}
	
	//////////////////////////////
	function processDateTime(dateString){
		var d = new Date(dateString);
		var month = d.getMonth();
		var date = d.getDate();
		var year = d.getFullYear();
		
		var hours = d.getHours();
		if(hours > 12){
			hours = (hours - 12);
		}
		var minutes = d.getMinutes();
		var seconds = d.getSeconds();
		
		if(hours > 11 && hours < 24){
			meridan = 'pm';
		}else{
			meridan = 'am';
		}
		
		var returnThis = month + '/' + date + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds + ' ' + meridan;
		return returnThis;
	}
	//////////////////////////////
	function trim(str){
		var pattern = /^( ){1,}|( ){1,}$/;
		return str.replace(pattern,'');
	}
	//////////////////////////////
	function validateMessage(str){
		var pattern = /^( ){1,}$|^()$/;
		var status = true;
		if(pattern.test(str) === true){
			status = false;
		}
		return status;
	}
	//////////////////////////////
	function logProperties(obj){
		for(x in obj){
			console.log('obj has property: ' + x + ': ' + obj[x]);
		}
	}