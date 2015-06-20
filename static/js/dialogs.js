//global variables:
var dialog = 0; //which dialog is shown. 0 if none is shown.
var isMoreButtonsMenu = false; //whether the more buttons menu is open or not.
var DIALOGS = undefined;

/**
 * Builds the help dialog HTML and returns it
 * @returns {String} HTML code of the help dialog
 */
function buildHelpDialog() {
	var typeHelp = "<table width='100%'>" +
	"<tr><td width=70%'><ul>" +
        "<li><a class='bold'>F2</a> : help docs</li>" +
	"<li><a class='bold'>left/right arrow</a> : go left/right in a sentence</li>" +
	"<li><a class='bold'>down/up arrow</a> : go to next/previous sentence</li>" +
	"<li><a class='bold'>space bar</a> : group or ungroup selected units</li>" +
	"<li><a class='bold'>shift+CATEGORY</a> : add a remote unit of the specified category (e.g., shift+a)</li>" +
        /*"<li><a class='bold'>alt+p</a> : add a referring unit (only in reference selection mode)</li>" + */
	"<li><a class='bold'>alt+i</a> : add implicit argument (only in remote selection mode)</li>" + 
	"<li><a class='bold'>alt+l</a> : add linkage between selected units</li>" +
        "<li><a class='bold'>alt+u</a> : declare unit in focus uncertain</li>" +
	"<li><a class='bold'>alt+f</a> : declare unit in focus finished</li>" +
	"<li><a class='bold'>alt+a</a> : declare all units finished</li>" +        
	"<li><a class='bold'>alt+e</a> : edit unit (also double click on a unit does that)</li>" +
	"<li><a class='bold'>alt+c</a> : combine two consecutive tokens into one</li>" +
	"<li><a class='bold'>Tab</a> : move to the LRU list</li>" + 
	"<li><a class='bold'>?</a> : help (this window)</li>" +
	"<li><a class='bold'>alt+s/ctrl+s</a> : save current annotation</li>" +
	"<li><a class='bold'>alt+r</a> : write comments for the passage</li>" +
        "<li><a class='bold'>alt+m</a> : write comments for the unit in focus</li>" +
        "<li><a class='bold'>alt+x</a> : reset (clear all annotation)</li>" +
	"<li><a class='bold'>alt+b</a> : submit current annotation</li>" +      
	"<li><a class='bold'>alt+t</a> : open settings dialog</li>" +      
        "<li><a class='bold'>del</a> : ungroup unit in focus</li>" + 
        "<li><a class='bold'>alt+h</a> : go to main menu</li>" + 
        "<li><a class='bold'>enter</a> : choose selected unit as remote unit (only in remote selection mode)</li>" +        
	"<li><a class='bold'>esc</a> : exit help</li>" +
	"</ul></td>" + 
	"<td width='30%'>Unit Types:" +
	"<ul id='unitTypes'>";
	for (var type in UNITTYPE) {
	    if (UNITTYPE[type].display) {
		typeHelp+="<li><a class='bold' onclick='openDocsDialog(\""+UNITTYPE[type].code+"\")'>" + 
                    UNITTYPE[type].key + "</a> : " + UNITTYPE[type].name + "</li>";
	    }
	}
	typeHelp += "</ul></td></tr></table>" +
	"<p style='position: absolute; bottom: 0px; right: 30px;'>" +
	"<b><a class='button' onmousedown='closeDialog();' " +
	"style='cursor: pointer;'>close [esc]</a></b></p>";
	return typeHelp;
}

/**
 * Creates HTML for a yes/no dialog
 * @param msg the message to display
 */
function YNdialog(msg) {
	var res = "<div style='text-align: center'>"+msg+"</div><div style='margin-top: 5px; text-align: center;'>"+
	"<a class='button' onmousedown='YNdialogAnswer(true);' style='cursor: pointer; margin: 1em; font-size: small; display: inline-block;'><u>Y</u>es</a>" + 
	"<a class='button' onmousedown='YNdialogAnswer(false);' style='cursor: pointer; font-size: small; display: inline-block;'><u>N</u>o</a>" + "</div>";
	return res;
}

function alertHtml(msg) {
    return "<div style='text-align: center; font-size: large; '>"+msg+"</div><div style='margin-top: 5px; text-align: right;'>"+
        "<a class='button'onmousedown='closeDialog();' style='position: absolute; bottom: 2px; right: 2px; cursor: pointer; font-weight: bold; font-size: small;'>Close [esc]</a>";

}

/**
 * Creates HTML for a head choosing dialog
 * @param unit
 */
function chooseHead(unit) {
	var res = "<h2 class='dialogtitle'>Choose head for unit:</h1><br />" +
	"<div class='sentence dialogUnit'><span id='chooseHeadUnitSpan'></span></div><center><br />" +
	"<b><a class='button' onmousedown='closeDialog();' " +
	"style='cursor: pointer;'>choose later [esc]</a></b>" +
	"<b><a class='button' onmousedown='headDialogNone();' " +
	"style='cursor: pointer;'>no head [n]</a></b>"  +
	"<b><a class='button' onmousedown='headDialogAccept();' " +
	"style='cursor: pointer;'>choose selected [space]</a></b></center>";
	return res;
}

/**
 * Builds the DIALOGS associative array
 */
function buildDialogs() {
	DIALOGS = {
	    1: {id: 'help', html: buildHelpDialog, functions: null, height: '36', width: '50'}, //help
	    2: {id: 'YN', html: YNdialog, functions: null, height: '6', width: '30'}, //yes or no dialog
	    3: {id: 'chooseHead', html: chooseHead, functions: null, height: '30', width: '60'},
	    4: {id: 'setLinkType', html: setLinkTypeHtml, functions: null, height: '25', width: '30'},
	    5: {id: 'linkageMode', html: linkageDialogHtml, functions: null, height: '20', width: '80'},
	    6: {id: 'remarks', html: remarksHtml, functions: null, height: '25', width: '20'},
	    7: {id: 'docs'}, 
	    8: {id: 'settings', html: settingsHtml, functions: null, height: '15', width: '15'},
            9: {id: 'alert', html: alertHtml, functions: null, height: '6', width: '30'}
	};
}

/**
 * Displays the docs dialog. content should be specified only when docId is 'local', meaning that the content of the dialog
 * will not be read from the server, but rather from the variable content.
 */
function openDocsDialog(docId, content) {
    if (docId == 'local' && arguments.length == 2) {
        setDocsDialog(content);
    }
    else {
	$.ajax({
		url : "/helpCode",
		data : "id=" + docId,
		type: "POST",
		success: function(a){
			if (a.msg) {
				setDocsDialog(a.msg);
			}
			return 1;
			if (a.redirect) {
				window.location.href = a.redirect;
			}
		},
		error: function(data){
			printUserMessage("Failed!");
			return -1;
		}
	});

	return 0;
    }
}

function setDocsDialog(a) {
    dialog = 7;
    $('#darken').fadeTo('fast', 0.4);
    $('#dialog').html(docsHtml(a));
    $('#dialog').attr("style","height: 80%; top: 10%; width: 80%; left: 10%; z-index: 400; overflow-y: auto; overflow-x: hidden; padding: 10px;");
    $('#dialog').fadeIn('fast',null);
    $('#dialog *').addClass('selectable');
}

function docsHtml(s) {
	var res = "<p style='text-align: center;'>"+s+"</p>" +
	"<p style='position: absolute; top: 2px; right: 30px;'>" +
	"<a class='button' onmousedown='closeDialog();' " +
	"style='cursor: pointer; font-family: Times New Roman;'>close [esc]</a></p>";
	return res;
}

/**
 * Displays a dialog
 * @param id the type of dialog
 */
function openDialog(id) {
	dialog=id;

	//if it's the docs dialog, this is the wrong function to call
	if (DIALOGS[dialog].id == 'docs') {
		throw 'call openDocsDialog() for opening docs dialogs, not openDialog()';
	}

	if (arguments.length == 1) {
		$('#dialog').html(DIALOGS[id].html);
		$('#dialog').attr("style","height: " + DIALOGS[dialog].height +
				"em; margin-top: " + (-DIALOGS[dialog].height/2) +
				"em; top: 50%;" + "width: " + DIALOGS[dialog].width +
				"em; margin-left: " + (-DIALOGS[dialog].width/2) + "em; left: 50%");
	}
	else {
		var args = Array.prototype.slice.call(arguments); //convert 'arguments' to array
		args.shift();
		$('#dialog').html(DIALOGS[dialog].html.apply(this,args)); //build html
		$('#dialog').attr("style","height: " + DIALOGS[dialog].height +
				"em; margin-top: " + (-DIALOGS[dialog].height/2) +
				"em; top: 50%;" + "width: " + DIALOGS[dialog].width +
				"em; margin-left: " + (-DIALOGS[dialog].width/2) + "em; left: 50%");
		DIALOGS[dialog].functions = args;
	}
	$('#dialog').fadeIn('fast',null);
}

/**
 * Closes a dialog
 */
function closeDialog() {
	$('#dialog').removeClass('rightBottomCorner');
	switch (dialog) {
	case 8:
            var settings = "";

	    //set display size
            var displaySize = "";
	    radioButtons = ["small", "medium", "large"];
	    for (var j=0; j < radioButtons.length; j++) {
		if (document.getElementById(radioButtons[j]+"SizeRadio").checked) {
		    displaySize = document.getElementById(radioButtons[j]+"SizeRadio").value;
		    settings += radioButtons[j] + ",";
		}
	    }

	    //set buttons size
            var buttonsSize = "";
	    for (var j=0; j < radioButtons.length; j++) {
		if (document.getElementById(radioButtons[j]+"ButtonsRadio").checked) {
		    buttonsSize = document.getElementById(radioButtons[j]+"ButtonsRadio").value;
		    settings += radioButtons[j];
		}
	    }
            
            updateDisplayBySettings(displaySize, buttonsSize);
	    $.ajax({
		url : "/saveSettings",
		data : "settings=" + settings,
		type: "POST",
		success: function(a){
		    if (a.msg) {
			printUserMessage(a.msg);
		    }
		    if (a.redirect) {
			window.location.href = a.redirect;
		    }	
		},
		error: function(data){
		    printUserMessage("Failed to save user settings!");
		}
	    });
	    break;
	case 7:
		$('#darken').hide();
		break;
	case 3:
		headDialogExit();
		break;
	case 0:
		return;
	}
	if (DIALOGS) { //if not at "home"
		DIALOGS[dialog].functions = null;
	}
	dialog=0;
	$('#dialog').html("");
	$('#dialog').fadeOut('fast',null);
}

function updateDisplayBySettings(displaySize, buttonSize) {
    setDisplaySize(displaySize);
    setButtonSize(buttonSize);
}

function YNdialogAnswer(yes) {
	if (yes) {
		if (DIALOGS[dialog].functions.length == 2) {
		    DIALOGS[dialog].functions[1].apply(this);
		}
		else {
		    DIALOGS[dialog].functions[1].apply(this,DIALOGS[dialog].functions[2]);
		}
	}
	else {
		switch (DIALOGS[dialog].functions.length) {
		case 5:
			DIALOGS[dialog].functions[3].apply(this,DIALOGS[dialog].functions[4]);
			break;
		case 4:
			DIALOGS[dialog].functions[3];
			break;
		}
	}
	DIALOGS[dialog].functions = null;
	closeDialog();
}
/**
 * Creates HTML for the linkage type dialogue.
 * @param msg the message to display
 */
function setLinkTypeHtml() {
	var res = "<div style= 'margin: 1em;'>Choose the linkage type: </div>" +
	"<img src='gif/x.gif' style='position: absolute; top:2px; right: 2px;' onclick='closeDialog()'></img>";

	for (var index in LINKTYPE) {
		if (index == 0) {
			continue; 
		}
		res = res +	"<b><a class='button linkButton' onmousedown='setLinkageFinish("+
		LINKTYPE[index].keyCode+");' " +
		"style='cursor: pointer; border: solid 1px; background:" + LINKTYPE[index].linkColor + " '>" + 
		LINKTYPE[index].name + " [" + LINKTYPE[index].key + "]</a></b>";                
	}
	res = res + "<b><a class='button linkButton' onmousedown='setLinkageFinish("+
	LINKTYPE[0].keyCode+");' " +
	"style='margin-top: 2em; cursor: pointer; border: solid 1px; background:" + LINKTYPE[0].linkColor + " '>" + 
	LINKTYPE[0].name + " [" + LINKTYPE[0].key + "]</a></b>";       
	return res;
}
/**
 * Linkage Mode.
 */
function linkageDialogHtml() {
	var res = "<center><table width='70%' id='mainLinkageTable' style='position: relative; top:10%; margin-left: auto; margin-right: auto'>" +
	"<tr> <td> <table id='precedingClausesTable' class='linkageModeTable'> </table> </td>" +
	"     <td> <div id='currentClause'></div> </td>" +
	"     <td> <table id='followingClausesTable' class='linkageModeTable'> </table> </td>" + 
	"</tr> <tr> <td></td> <td> <center><table id='otherClausesTable' style='margin-top: 25px;'></table></center> </td> <td></td> </tr> </table></center>";
	return res;
}


/**
 * The html of the settings file.
 */
function settingsHtml() {

	display = ['', '', ''];
	switch (active_display_class) {
	case 'small-display-size':
		display[0] = 'checked';
		break;
	case 'medium-display-size':
		display[1] = 'checked';
		break;
	case 'large-display-size':
		display[2] = 'checked';
		break;
	}

    buttonsSize = ['', '', ''];
    switch (active_button_size) {
    case 'small-buttons':
        buttonsSize[0] = 'checked';
        break;
    case 'medium-buttons':
        buttonsSize[1] = 'checked';
        break;
    case 'large-buttons':
        buttonsSize[2] = 'checked';
        break;
    }

    var res = 
	"<div style='text-align: left;'><input id='smallSizeRadio' type='radio' name='display-size' value='small' "+display[0]+"><a>small display</a></div>" +
	"<div style='text-align: left;'><input id='mediumSizeRadio' type='radio' name='display-size' value='medium' "+display[1]+"><a>medium display</a></div>" +
	"<div style='text-align: left; margin-bottom: 10px;'><input id='largeSizeRadio' type='radio' name='display-size' value='large' "+display[2]+"><a>large display</a></div>" +
	"<div style='text-align: left;'><input id='smallButtonsRadio' type='radio' name='button-size' value='small' "+buttonsSize[0]+"><a>small buttons</a></div>" +
	"<div style='text-align: left;'><input id='mediumButtonsRadio' type='radio' name='button-size' value='medium' "+buttonsSize[1]+"><a>medium buttons</a></div>" +
	"<div style='text-align: left;'><input id='largeButtonsRadio' type='radio' name='button-size' value='large' "+buttonsSize[2]+"><a>large buttons</a></div>" +
	"<p style='position: absolute; bottom: 0px; right: 5px;'>" + 
	"<a class='button' onmousedown='closeDialog();' " + 
	"style='cursor: pointer;'>close [esc]</a></p>";
    return res;
}

/**
 *  Open a dialog with the less useful buttons.
 */
function moreButtonsHtml() {
	res = "<img src='gif/x.gif' style='position: absolute; top:2px; right: 2px;' onclick='closeMoreButtonsMenu()'></img>" +
	"<table style='margin-left:auto; margin-right:auto'><tr><td><p class='moreButton' onclick='moreButtonsFunc(1);'>one word [Sh. o]</p>" +
	"<p class='moreButton' onclick='moreButtonsFunc(2);'>unanalyzable [Sh. u]</p>" +
	"<p class='moreButton' onclick='moreButtonsFunc(3);''>uncertain [Sh. v]</p></td><td>" +
	"<p class='moreButton' onclick='moreButtonsFunc(4);'>edit unit [e]</p>"+
	"<p class='moreButton' onclick='moreButtonsFunc(5);'>deselect [d]</p>" +
	"<p class='moreButton' onclick='moreButtonsFunc(6);'>jump [j]</p>" +
	"</td></tr></table>";
	return res;
}

/**
 * More buttons function
 */
function moreButtonsFunc(buttonCode) {
	closeMoreButtonsMenu();
	switch (buttonCode) {
	case 1:
		union();
		break;
	case 2:
		setUnanalyzable();
		break;
	case 3:
		setUncertainAnnotation();
		break;
	case 4:
		edit();
		break;
	case 5:
		if (remoteAdd == null) {
			deselect();
		}
		break;
	case 6:
		jumpToSelected();
		break;
	}
}

/**
 * Open more buttons menu.
 */
function openMoreButtonsMenu() {
	isMoreButtonsMenu = true;
	$('#moreButtonsMenu').toggle();
	$('#moreButtonsMenu').html(moreButtonsHtml);
}

/**
 * closes the more buttons menu.
 */
function closeMoreButtonsMenu() {
	isMoreButtonsMenu = false;
	$('#moreButtonsMenu').html("");
	$('#moreButtonsMenu').toggle();
}

