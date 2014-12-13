//////////////////////////////
function appendToChat(str,scrollStatus){
	var message = $('<li>').html(str).hide();
		message.appendTo('#nodeChat_messages').slideDown(1000, function(){ scrollChat(scrollStatus) });
	//$('#nodeChat_messages').append(	
	//	message.slideDown(1000, function(){ scrollChat(scrollStatus) })
	//);
}
//////////////////////////////
function scrollChat(scrollStatus){
	console.log('Scroll Chat...' + scrollStatus);
	if(scrollStatus === true){
		height = $('ul').prop('scrollHeight');
		console.log('height: ' + height);
		$('ul').animate({ scrollTop:height},500);
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
