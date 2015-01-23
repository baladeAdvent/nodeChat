//////////////////////////////
function updateRegistrationButton(status){
	usernameAddon = $('#register_username_addon').find('i');
	if(status == 'true'){
		console.log('Username is okay to use!');
		usernameAddon.attr('class','glyphicon glyphicon-ok');
	}else{
		console.log('Username is NOT okay to use!');
		usernameAddon.attr('class','glyphicon glyphicon-remove');
	}
}
//////////////////////////////
function appendToChat(str,scrollStatus){
	var message = $('<li class="message">').html(str).hide();
		message.appendTo('#nodeChat_messages').slideDown(300, function(){ scrollChat(scrollStatus) });
}
//////////////////////////////
function scrollChat(scrollStatus){
	//console.log('Scroll Chat...' + scrollStatus);
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
function log(msg){
	console.log(msg);
}

function logProperties(obj){
	for(x in obj){
		console.log('obj has property: ' + x + ': ' + obj[x]);
	}
}