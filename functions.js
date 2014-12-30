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
	console.log(list[0]['username']);
	var des = $('#nodeChat_users');
		des.html('');
		for(x in list){
			console.log('Update User List: ' + list[x]);
			des.append( $('<li>').css('color',list[x]['color']).html(list[x]['username']) );
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
