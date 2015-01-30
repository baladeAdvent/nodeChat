
$(document).ready(function(){
	var host = location.origin.replace(/^http/,'ws');
	ws = new WebSocket(host);	
	
	ws.onopen = function(event){
		$('body').append('<p>Connection Open...</p>');
	}
	ws.onclose = function(event){
		$('body').append('<p>Connection Closed...</p>');
		
	}
});