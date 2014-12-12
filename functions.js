function stringify(obj){
	output = '';
	for(x in obj){
		output += x + '~:~' + obj[x] + '}:}';
	}
	return output.replace(/}:}$/,'');
}

function scrollChat(scrollStatus){
	if(scrollStatus === true){
		boxHeight = $('#nodeChat_messages').height();
		console.log(boxHeight);
	}
}
//////////////////////////////
function parseData(str){
	var Obj = [];
	
	var array1 =  str.split('}:}');
	for(x in array1){
		parts = array1[x].split('~:~');
		if(parts[0] != ''){
			Obj[parts[0]] = parts[1];
		}
	}
	return Obj;
}

function trim(str){
	var pattern = /^( ){1,}|( ){1,}$/;
	return str.replace(pattern,'');
}

function log(msg){
	console.log(msg);
}