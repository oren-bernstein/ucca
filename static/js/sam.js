$(document).ready(function(){
	$.ajax({
		url : "/getProjectNames",
		type: "POST",
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
			var arr=$.parseJSON(a);
			for (var i=0; i<arr.length; i++) {
				var option = document.createElement('option');
				option.setAttribute('value', arr[i].prid);
				option.appendChild(document.createTextNode(arr[i].name + " (" + arr[i].version + ")"));
				$("#projects").append(option);
			}
		},
		error: function(data){
			error("Failed");
		}
	});
});

function submit() {
    var passage=uni2ent($('#textInput').val());
    var sourceText=uni2ent($('#source').val());
    var prid = $('#projects').val();
    if (passage == "" || sourceText == "") {
        $('#msg').html('Please enter a text to annotate and specify its source.');
        return;
    }
    format = $('input:radio[name=format]:checked').val()
    $.ajax({
	url : "/insertPassage",
	type: "POST",
	data: {text: passage, source: sourceText, sam: true, format: format, prid: prid},
	success: function(a){
	    if (a.redirect) {
		window.location.href = a.redirect;
		return;
	    }
	},
    });
}

function uni2ent(srcTxt) {
	var entTxt = '';
	var c, hi, lo;
	var len = 0;
	for (var i=0, code; code=srcTxt.charCodeAt(i); i++) {
		var rawChar = srcTxt.charAt(i);
		// needs to be an HTML entity
		if (code > 255) {
			// normally we encounter the High surrogate first
			if (0xD800 <= code && code <= 0xDBFF) {
				hi  = code;
				lo = srcTxt.charCodeAt(i+1);
				// the next line will bend your mind a bit
				code = ((hi - 0xD800) * 0x400) + (lo - 0xDC00) + 0x10000;
				i++; // we already got low surrogate, so don't grab it again
			}
			// what happens if we get the low surrogate first?
			else if (0xDC00 <= code && code <= 0xDFFF) {
				hi  = srcTxt.charCodeAt(i-1);
				lo = code;
				code = ((hi - 0xD800) * 0x400) + (lo - 0xDC00) + 0x10000;
			}
			// wrap it up as Hex entity
			c = "&#x" + code.toString(16).toUpperCase() + ";";
		}
		else {
			c = rawChar;
		}
		entTxt += c;
		len++;
	}
	return entTxt;
}
