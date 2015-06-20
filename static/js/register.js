function checkAndRegister() {
	user = $('input[name="user"]').val();
	pass = $('input[name="pass"]').val();
	email = $('input[name="email"]').val();
    fullname = $('input[name="fullname"]').val();
    affiliation = $('input[name="affiliation"]').val();

	var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	if (!filter.test(email)) {
		$('#errorPrinter').html("Not a valid e-mail address");
		return;
	}
	$.ajax({
		url: "/submitRegistration",
		data : "user=" + user + "&pass=" + pass + "&email=" + email + "&fullname=" + fullname + "&affil=" + affiliation,
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