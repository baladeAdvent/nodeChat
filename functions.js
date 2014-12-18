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
function updateUserlist(arr){
	var des = $('#nodeChat_users');
		des.html('');
		for(x in arr){
			console.log('Update User List: ' + arr[x]);
			des.append($('li').html(arr[x]));
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
