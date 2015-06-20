$(document).ready(function() {
    disableSelection(document.getElementById("new_submit_button"));
});

function login() {
	user = $('input[name="user"]').val();
	pass = $('input[name="pass"]').val();
	$.ajax({
		url: "/submitLogin",
		data : "user=" + user + "&pass=" + pass,
		type: "POST",
		success: function(data){
			if (data.error) {
				$('#errorPrinter').html(data.error);
				return;
			}
	        if (data.redirect) {
	            // data.redirect contains the string URL to redirect to
	            window.location.href = data.redirect;
	        }
		}
	});
	
}

function disableSelection(target){
	if (typeof target.onselectstart != "undefined") //IE route
		target.onselectstart = function() {return false;};
		else if (typeof target.style.MozUserSelect != "undefined") //Firefox route
			target.style.MozUserSelect = "none";
		else //All other route (ie: Opera)
			target.onmousedown = function() {return false;};
			target.style.cursor = "default";
}

function keyPress(e) {
    if(e.which) {
	var keynum = e.which;
        if (keynum == 13) {
            login();
        }
    }
}