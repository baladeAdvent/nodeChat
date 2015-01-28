///////////////////////////////////////////////////////////////////
// Login functions
///////////////////////////////////////////////////////////////////
	function updateLoginButton(nameStatus,connection){
		console.log('updateLoginButton: ' + nameStatus);
		usernameAddon = $('#nodeChat_login_username_addon').find('i');
		if(nameStatus == 'true'){
			// Set icon to ok, bind functions to register button
			usernameAddon.attr('class','glyphicon glyphicon-ok');
		}else{
			// Set icon to unavailable, clear functions from register button
			usernameAddon.attr('class','glyphicon glyphicon-remove');
		}
	}
	
	function validateLogin(connection){
		validationStatus = true;
		$('nodeChat_loginForm input').each(function(index){
			if($(this).val() == '') validationStatus = false;
		});

		if(validationStatus == false){
			message = $('<div></div>').attr('class','alert alert-danger').html('Please fill out all form fields to register!');
			$('#nodeChat_loginResponse').append( message ).hide().animate({height:'show'},500).delay(8000).animate({height:'hide'},500);
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
			connection.send(JSON.stringify(obj));
		}
	}
	
///////////////////////////////////////////////////////////////////
// Registration functions
///////////////////////////////////////////////////////////////////
	function registrationResponse(result,username){
		registrationForm = $('#nodeChat_registerForm');
		registerButton = registrationForm.find('button');
		message = $('<div></div>');
		if(result == 'success'){
			message.attr('class','alert alert-success').html('Success! The following username  has been registered and is available for your use! : ' + username);
		}else{
			message.attr('class','alert alert-danger').html('An error has occured while trying to register this username! Please try a different username or use a different email account. : ' + username);
			registerButton.prop('disabled',false);
		}
		$('#nodeChat_registrationResponse').html('').append( message ).hide().animate({height:'show'},500).delay(10000).animate({height:'hide'},500);
	}
	
	function updateRegistrationButton(nameStatus,connection){
		usernameAddon = $('#nodeChat_register_username_addon').find('i');
		registerButton = $('#nodeChat_registerForm').find('button');
		console.log('updateRegistrationButton: ' + nameStatus);
		if(nameStatus == 'true'){
			// Set icon to ok, bind functions to register button
			usernameAddon.attr('class','glyphicon glyphicon-ok');
			registerButton.prop('disabled',false);
			registerButton.click(function(evt){
				evt.preventDefault();
				validateRegistration(connection);
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
	
	function validateRegistration(connection){
		validationStatus = true;
		$('#nodeChat_registerForm input').each(function(index){
			if($(this).val() == '') validationStatus = false;
		});

		if(validationStatus == false){
			message = $('<div></div>').attr('class','alert alert-danger').html('Please fill out all form fields to register!');
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
			connection.send(JSON.stringify(obj));
		}
	}

///////////////////////////////////////////////////////////////////
// Chat functions
///////////////////////////////////////////////////////////////////
	function startNodeChat(result,username){
		if(result == 'success'){
			loginContainer = $('#nodeChat_login').animate({height:'hide'},500,'ease');
			chatContainer = $('#nodeChat_client').animate({height:'show'},500,'ease');
			
			$('#nodeChat_header').find('span').html(username);
		}else{
			message = $('<div></div>').attr('class','alert alert-danger').text('Unable to login...');
			$('#nodeChat_loginResponse').html('').append( message ).hide().animate({height:'show'},500).delay(8000).animate({height:'hide'},500);
		}
	}

	function appendSystemToChat(message,color){
		message = $('<li></li>').attr('class','').html('SYSTEM> ' + message);
		$('#nodeChat_messages').append( message );
	}


















	function appendToChat(str,scrollStatus){
		var message = $('<li class="message">').html(str).hide();
			message.appendTo('#nodeChat_messages').slideDown(300, function(){ scrollChat(scrollStatus) });
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
	function updateUserlist(json){
		console.log('userlistJSON: '+json);
		var list = JSON.parse(json);
		var des = $('#nodeChat_users');
			des.html('');
			for(x in list){
				user = list[x];
				logProperties(list[x]);
				des.append( $('<li style="color:rgb(' + user['color'] + ');">').html(user['name']) );
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