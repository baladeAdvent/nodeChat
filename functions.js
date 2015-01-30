var username = '';
var loggedIn = false;
var autoScroll = true;

var host = location.origin.replace(/^http/,'ws');
ws = new WebSocket(host);

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

///////////////////////////////////////////////////////////////////
// WebSocket handling
///////////////////////////////////////////////////////////////////
	ws.onopen = function(event){
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
		logProperties(edata);
		switch(edata.type){
		
			// Login
			case 'SYSTEM_CHECK_LOGIN_AVAILABILITY':
				updateLoginButton(edata.available);
				break;
				
			case 'SYSTEM_RESPONSE_LOGIN_VERIFY':
			case 'SYSTEM_RESPONSE_LOGIN_ANONYMOUS':
				//console.log('login verification recieved');
				startNodeChat(edata.result,edata.username,edata.textColor);
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
				appendSystemToChat(edata.message,edata.color);
				break;
				
			case 'SYSTEM_UPDATE_USER_LIST':
				updateUserlist(edata.userlist);
				break;
				
			case 'SYSTEM_RESPONSE_CHAT_LOG':
				appendChatLog(edata.chatlog);
				break;
				
			case 'SYSTEM_RESPONSE_CHAT_MESSAGE':
				appendToChat(edata.username,edata.message,edata.color);
				break;
				
			// Heartbeat
			case 'SYSTEM_HEARTBEAT':
				missed_heartbeats = 0;
				break;
		}
	}
	// WS Response handling //

	ws.onclose = function(event){
		appendSystemToChat('Connection closed...','100,100,100');
		userlist_interval = null;
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
		console.log('validateLogin()');
		var errors = new Array();
		validationStatus = true;
		$('#nodeChat_loginForm input').each(function(index){
			console.log($(this).attr('id') + ':' + trim($(this).val()) + ':' + $(this).prop('disabled'));
			if( trim($(this).val()) == '' && $(this).prop('disabled') == false){
				validationStatus = false;	
			}
		});

		if(validationStatus == false){
			message = $('<div></div>').attr('class','alert alert-danger').html('Please fill out all form fields to login');
			$('#nodeChat_loginResponse').html('').append( message ).hide().animate({height:'show'},500).delay(8000).animate({height:'hide'},500);
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
			};
			// Note: Disable Login Form at this point, wait for response from server
			sendToServer(obj);
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
			message.attr('class','alert alert-success').html('Success! The following username  has been registered and is available for your use! : ' + username);
			registrationForm[0].reset();
		}else{
			message.attr('class','alert alert-danger').html('An error has occured while trying to register this username! Please try a different username or use a different email account. : ' + username);
			registerButton.prop('disabled',false);
		}
		$('#nodeChat_registrationResponse').html('').append( message ).hide().animate({height:'show'},500).delay(10000).animate({height:'hide'},500);
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
			console.log($(this).attr('id') + ':' + trim($(this).val()));
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
			 $('#nodeChat_registrationResponse').html('').append( message ).hide().animate({height:'show'},500).delay(5000).animate({height:'hide'},500);
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
	function startNodeChat(result,username,color){
		if(result == 'success'){
			loginContainer = $('#nodeChat_login').animate({height:'hide'},500);
			chatContainer = $('#nodeChat_client').animate({height:'show'},500);
			
			$('#nodeChat_header').find('span').html(username);
			
			parts = color.split(',');
			$('#textColor').ColorPickerSetColor({r:parts[0],g:parts[1],b:parts[2]});
			$('#textColor div').css('backgroundColor', 'rgb(' + color + ')');
			requestChatLog();
			requestUserlist();
		}else{
			message = $('<div></div>').attr('class','alert alert-danger').text('Unable to login...');
			$('#nodeChat_loginResponse').html('').append( message ).hide().animate({height:'show'},500).delay(8000).animate({height:'hide'},500);
		}
		
		userlist_interval = setInterval(function(){
			requestUserlist();	
		},15000);
	}
	
	function processChatMessage(){
		var message = $('#nodeChat_message').val();

		if( validateMessage(message) == true){
			var obj = {
				'type': 'USER_PUBLIC_CHAT_MESSAGE',
				'message': message
			};
			sendToServer(obj);
			$('#nodeChat_message').val('');
		}
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
				logProperties(log[i]);
				var label = $('<span></span>').css('color','rgb('+log[i].color+')').css('font-weight',800).text(log[i].username + ': ');
				var message = $('<li></li>').attr('class','nodeChat_chat_message').html(log[i].message).prepend(label);
				$('#nodeChat_messages').append( message );
			}
	}
	
	function appendSystemToChat(message,color){
		var label = $('<span></span>').css('color','rgb('+color+')').css('font-weight',800).text('SYSTEM: ');
		var message = $('<li></li>').attr('class','').html(message).prepend(label);
		$('#nodeChat_messages').append( message );
	}
	
	function appendToChat(username,message,color){
		var label = $('<span></span>').css('color','rgb('+color+')').css('font-weight',300).text(username + ': ');
		var message = $('<li></li>').attr('class','').html(message).prepend(label);
		$('#nodeChat_messages').append( message );
	}

	function updateUserlist(data){
		var destination = $('#nodeChat_userlist');
			destination.html('');
		
		for(i=0;i<data.length;i++){
			logProperties(data[i]);
			var item = $('<li></li>').css('color','rgb('+data[i].color+')').html(data[i].name);
			destination.append( item );
		}
	}

	function checkAvailability(obj){
		console.log('Check username availability');
		sendToServer(obj);
	}
	
	function updateTextColor(color){
		var obj = {
			'type': 'USER_REQUEST_UPDATE_COLOR',
			'color': color.r + ',' + color.g + ',' + color.b
		};
		sendToServer(obj);
	}

	function sendToServer(obj){
		console.log('sendToServer()');
		console.log(obj);
		ws.send(JSON.stringify(obj));
	}
	
	

	//////////////////////////////
	function scrollChat(scrollStatus){
		if(scrollStatus === true){
			el = $('#nodeChat_messages');
			height = el.prop('scrollHeight');
			console.log('height: ' + height);
			el.animate({ scrollTop:height},300);
		}
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