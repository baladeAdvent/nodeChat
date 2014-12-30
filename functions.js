//////////////////////////////
function appendToChat(str,scrollStatus){
	var message = $('<li>').html(str).hide();
		message.appendTo('#nodeChat_messages').slideDown(100, function(){ scrollChat(scrollStatus) });
}
//////////////////////////////
function scrollChat(scrollStatus){
	//console.log('Scroll Chat...' + scrollStatus);
	if(scrollStatus === true){
		el = $('#nodeChat_messages');
		height = el.prop('scrollHeight');
		console.log('height: ' + height);
		el.animate({ scrollTop:height},100);
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
			console.log(user['username']);
			des.append( $('<li>').html(user['username']).css('color',user['color']) );
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