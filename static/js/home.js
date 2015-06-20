var username = "";
var globalData;
var XMLS = {'reference1': 846, 'reference2': 844, 'reference3': 843, 'reference4': 842}

$(document).ready(function() {
    if (navigator.appName != 'Netscape') {
        $('#bodyDiv').remove();
        $('body').html('We do not support your browser. Please use Firefox or Chrome instead.');
    }
});

function getLinks() {
    $.ajax({
	url: "/homeLinks",
	type: "POST",
	success: function(data){
	    if (data.error) {
		$('#errorPrinter').html(data.error);
		return;
	    }
            
	    if (data.links && data.order) {
		$('#errorPrinter').html(data);
                if (data.status == 1) {
                    $('#links').append("<div style='font-size: 11pt; font-weight: bold; margin-left: -1em; margin-bottom: 0.5em; text-decoration:underline'>General Options:</div>");
                }
                var keysArr = new Array();
		for (i in data.order) {
                    keysArr.push([data.order[i], i]);
                }
                keysArr.sort(function(a,b){return a[0] - b[0];});

                var seenPositive = false;
		for (var i=0; i < keysArr.length; i++) {
                    if (keysArr[i][0] > 0 && !seenPositive && data.status == 1) {
                        seenPositive = true;
                        addAdminOptionsTitle();
                    }
		    addLinkButton(data.links[keysArr[i][1]], keysArr[i][1]);
		}
	    }
            
            switch (data.status) {
            case 0:
                document.getElementById("helpButton").setAttribute("onclick", "openDocsDialog('HOME_NOT_LOGGEDIN');");
                break;
            case 1:
                document.getElementById("helpButton").setAttribute("onclick", "openDocsDialog('HOME_ADMIN');");
                $("#explanation").hide();
                break;
            default:
                document.getElementById("helpButton").setAttribute("onclick", "openDocsDialog('HOME_USER');");
                $("#explanation").hide();
                break;
            }
            
            if (data.username) {
                username = data.username;
                $("#username").html("<b>User: </b>"+username);
            }
	}
    });
}


function addLinkButton(str, i) {
    if (i.lastIndexOf("reference",0) == 0) {
        $('#links').append('<li><a onclick="openByXid(' + XMLS[i] + ')" style="cursor:pointer; color:blue;"><u>' + str
		       + '</u></a></li>');
    }
    else {
        $('#links').append('<li><a href="/' + i + '">' + str + '</a></li>');
    }
}

function addAdminOptionsTitle() {
    $('#links').append("<hr width='50%' align='left'><div style='font-size: 11pt; font-weight: bold; margin-left: -1em; margin-bottom: 0.5em; margin-top: 0.5em; text-decoration:underline'>Adminstrator Options:</div>");
}

$(document).ready(function() {
    getLinks();
});

function openByXid(xid) {
    $.ajax({
	url : "/openByXid",
	type: "POST",
	data: "xid=" + xid,
	success: function(a){
	    if (a.redirect) {
		// data.redirect contains the string URL to redirect to
		window.location.href = a.redirect;
		return;
	    }
	},
	error: function(data){
	}
    });
}

