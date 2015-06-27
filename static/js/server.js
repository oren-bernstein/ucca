var X = new Object();
var prevCursor = null;
var KEY_PREFIX = 1000; //the number the array UNITTYPE will start from
var rtid = -1;
var right_to_left = false;

function save(auto) {
    prevCursor = document.getElementById('bodyDiv').style.cursor;
    document.getElementById('bodyDiv').style.cursor = 'wait';
    if (!auto){
	clearTimeout(autosaveTimer);
	autosaveTimer = setTimeout("autoSave();", autosaveInterval);
	prevXML = createXML(passageID);
    }
    else {
        return;
    }
    $.ajax({
	url : "/save",
	data : {xml: prevXML, rtid: rtid, pid: passageID, prid: projectID, comment: curRemarks, autosave: auto},
	type: "POST",
	success: function(a){
	    if (!auto) {
		printUserMessage(a);
	    }
	    document.getElementById('bodyDiv').style.cursor = prevCursor;
	},
	error: function(data){
	    printUserMessage("Failed!");
	    document.getElementById('bodyDiv').style.cursor = prevCursor;
	}
    });
}

function updatePassage() {
	$.ajax({
	    url : "/updatePassage",
	    data : {pid:  passageID, passage: passageString()},
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
		printUserMessage("Failed!");
	    }
	});
}
    
function reportUnfit() {
	$.ajax({
		url : "/reportUnfit",
		data : "paid=" + passageID + "&prid=" + projectID,
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
			printUserMessage("Failed!");
		}
	});
}
function submit() {
	$.ajax({
		url : "/submit",
		data : {xml: createXML(passageID), pid: passageID, rtid: rtid, prid: projectID, comment: curRemarks},
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
			printUserMessage("Failed!");
		}
	});
}
function loadPassage(id, reset) {
	if (!arguments.length) {
		id = -1;
	}
	else if (arguments.length == 1) {
		reset = false;
	}
	if (reset) {
		lruQueue = [];
	}
	$.ajax({
		url: "/loadPassageById",
		data : "id=" + id + "&reset=" + reset,
		type: "POST",
		success: function(a){
		    if (a.redirect) {
			window.location.href = a.redirect;
		    }
                    if (a.format_val == '1') { //rtl
                        right_to_left = true; 
                    }
                    else {
                        right_to_left = false;
                    }
			if (a.scheme) {
				loadScheme(a.scheme);
				addToCss();
			}
			if (a.mode) {
				mode = a.mode;
			}
			if (a.rtid) {
				rtid = a.rtid;
			}
			if (a.id) {
			    passageID = a.id;
			    projectID = a.project;
                            schemeVersion = a.schemeVersion;
				orderedLinkages = [];
				isHidden = new Array();
				$("#textDiv").empty();
				pointerLoc = 0;
				addMarkingButtons();
				if (a.passage) {
					if (a.autosaveXml) {
						openDialog(2, "An unsaved draft was found. Do you want to use it instead of saved annotation? Click 'no' to use saved annotation.",
								chooseXMLandFinishLoad,[a.autosaveXml, a.autosaveComment, a.settings],
							   passageFinishLoad,[a.passage, a.settings, a.simpleParse]);
					}
					else {
					    passageFinishLoad(a.passage, a.settings, a.simpleParse);
						
					}
				}
				else {
					if (a.autosaveXml) {
					openDialog(2, "An unsaved draft was found. Do you want to use it instead of saved annotation? Click 'no' to use saved annotation.",
							chooseXMLandFinishLoad,[a.autosaveXml, a.autosaveComment, a.settings],
							chooseXMLandFinishLoad,[a.xml, a.comment, a.settings]);
					}
					else {
						chooseXMLandFinishLoad(a.xml, a.comment, a.settings);
					}
				}
			}
			if (a.username) {
				username = a.username;
				$("#username").html("<b>User:</b> "+username);
			}
			addMarkingButtons();
			addOtherButtons();
			if (rtid > 0) {
				annotationReviewButtons();
			}
		}
	});
}
function passageFinishLoad(passage, settings, simpleParse, rec_val) {
    if (right_to_left) {
        s = parseToUnicode_heb(passage)
    }
    else {
        s = parseToUnicode_heb(passage)
        //s = parseToUnicode(passage)
    }
    var unit = stringToUnits(s, simpleParse, rec_val);
    finishLoad(unit,settings);
}
function chooseXMLandFinishLoad(xml, settings) {
	parseXML(xml);
	var unit = allUnits[0];
	finishLoad(unit,settings);
}
function finishLoad(unit,settings) {
	initHierarchy(unit);
	refreshLRU();
	if (settings) {
		var settingsArr = settings.split(",");
		updateDisplayBySettings(settingsArr[0], settingsArr[1]);
	}
	else {
		setDisplaySize('small');
	}
	prevXML = createXML(passageID);
}
function logout() {
	$.ajax({
		url: "/logout",
		type: "POST",
		success: function(a){
			passageID = a.id;
		    var unit = stringToUnits(a.sent, false);
			$("#textDiv").empty();
			initHierarchy(unit);
		}
	});
}

/**
 * Loads the xml text. 
 */
function loadScheme(xmlString) {
    var xDoc;
    if (window.ActiveXObject) { //IE
	xDoc = new ActiveXObject("MSXML2.DOMDocument");
	xDoc.async = false;
	xDoc.loadXML(xmlString);
    }
    else {
	var dp = new DOMParser();
	xDoc = dp.parseFromString(xmlString, "text/xml");
    }

    var schemeElem = xDoc.getElementsByTagName("scheme")[0];
    var key_index = 0; //how many keys were used so far
    for (var i=0; i < schemeElem.childNodes.length; i++) {
	//go over children and create elements of that name in an array. in the end, convert key to keycode. 
    	var curCategoryElem = schemeElem.childNodes[i];
    	var curEntry = new Object();
    	for (var j=0; j < curCategoryElem.childNodes.length; j++) {
    	    if (curCategoryElem.childNodes[j].nodeType == 1) { //if it is an element and not text
    		if (curCategoryElem.childNodes[j].textContent == "false" || curCategoryElem.childNodes[j].textContent == "true") {
    		    curEntry[curCategoryElem.childNodes[j].nodeName] = (curCategoryElem.childNodes[j].textContent == "true");
    		}
    		else {
    		    curEntry[curCategoryElem.childNodes[j].nodeName] = curCategoryElem.childNodes[j].textContent;
    		}
    	    }
    	}
    	if (curCategoryElem.childNodes.length > 0) {
    	    UNITTYPE[key_index+KEY_PREFIX] = appendArray(KEYINVENTORY[key_index], curEntry);
    	    UNITTYPE[key_index+KEY_PREFIX].changable = true;
    	    if (UNITTYPE[key_index+KEY_PREFIX].display==undefined) {
    	    	UNITTYPE[key_index+KEY_PREFIX].display = true;
    	    }
    	    key_index++;
    	}
    }

    for (numkey in UNITTYPE) {
    	if (UNITTYPE[numkey].key && UNITTYPE[numkey].display) {
    		var curKeyCode = UNITTYPE[numkey].key.charCodeAt(0) - 32;
    		keyboardShortcuts[curKeyCode] = numkey;
    	}
    }
}

function loadByXid(xid) {
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
			error("Failed");
		}
	});
}


/**
 * Given two associative arrays, add all the key,value pairs of B into A and return A. 
 * If A already contained a certain key, the value in B is kept.
 */
function appendArray(A, B) {
	for (var key in B) {
		A[key] = B[key];
	}
	return A;
}

/**
 * Returns the passage that is currently loaded.
 */
function passageString() {
    paragraphs = allUnits[0].units;
    s = "";
    for (p in paragraphs) {
        s += paragraphs[p].toString() + "\n\n";
    }
    return s;
}


function parseToUnicode_heb(str) {
    //    var pattern = /\x26\x23x[A-F\d]{4}\x3B/g;
    var pattern = /\x26\x23x[A-F\d]{3}\x3B/g;
    while (pattern.test(str)) {
        var ind = pattern.lastIndex;
        num = str.substring(ind-4,ind-1);
        var uni = '\\u0' + num + '@'
        str = str.substring(0,ind-7) + uni + str.substring(ind);
        console.log(str);
    }
    var re = new RegExp('@', 'g');
    var res = str.replace(re, '')
    return parseToUnicode(res);
}
function parseToUnicode(str) {
        var pattern = /\x26\x23x[A-F\d]{4}\x3B/g;
        while (pattern.test(str)) {
                var ind = pattern.lastIndex;
                num = str.substring(ind-5,ind-1);
                var uni = '\\u' + num;
                str = str.substring(0,ind-8) + uni + str.substring(ind);
        }
        return str;
}
