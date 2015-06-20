/**
 * Global variables.
 */
var username = ""; //the name of the user logged in
var reviewOf = -1;
var passageID = -1;
var projectID = -1;
var schemeVersion = -1;
var pointerUnit; //in which unit the pointer stands
var pointerLoc = 0; //location of pointer in unit
var passageLoc = 0; //location of pointer in root unit in its latest visit there
var passageUnit; //paragraph of pointer in root unit in its latest visit there
var anchorUnit = null; //beginning of selection when using mouse.
var focusUnit = null; //the end of selection when using mouse.
var selecting = false;
var selectedUnits = new Array();
var selectedNCURepresentatives = new Array(); //when a non-contiguous unit (NCU) is selected, the first part of it that is selected is entered into this array
var tempSelectedUnits = new Array(); //used only for selecting with mouse
var t; //timing object;
var control = false;	//true if pointer should be shown (keyboard control).
var cursorInLRU = false;   //true if we select a unit from the LRU
var lruCursorIndex = 0;    //the index of the selected cursor in the LRU if we are currently selecting from there.
var demo = false;	//set demo mode.
var xmlDemo = false;    //if in demo mode, it treats the text as an xml file.
var isUnitNodeOpen = new Array();
var isHidden = new Array(); //sparse array. keys are unit ids. if a unit is a child of a paragraph, has true/false, otherwise non-existant. 
var lruQueue = new Array(); //the queue of recently tagged units
var lastScrollPos = -1; //the position of the passage scroll bar.
var lastScrollPosMain = -1; //the position of the main scroll bar.
var prevXML = "";
var autosaveInterval = 10000;
var autosaveTimer;
var mode = "basic";

var active_display_class = 'small-display-size';
var active_button_size = 'small-buttons';
var keyboardShortcuts = new Object(); //maps category alphabetic keys to category numerical keys


/**
 * Global Constants
 */
var lruMaxSize = 1000;
var ELIPSIS_SYMBOL = "... ";
var maxNumChars = 60; //the maximum number of chars in the display of a unit in the LRU.
var lastScrollPos = -1; //the position of the scroll bar.
var xxx = -1; //debug
var topButtonsShown = false;
var noAnimationFlag = false;
var FIRST_FLAG = "XXXXXXXXXXXX";


/**
 *
 */
$(document).ready(function() {
    buildDialogs();
    disableSelection(document.getElementById("bodyDiv"));
    if (!demo) {
	loadPassage(-1);
    }
    $('#topButtons').mouseenter(function() {$('.top-button').fadeTo('slow', 100);});
    $('#topButtons').mouseleave(function() {$('.top-button').fadeTo('fast', 0.1);});

    $('#buttons').mouseenter(function() {$('.catButtonIcon').fadeTo('slow', 100);});
    $('#buttons').mouseleave(function() {$('.catButtonIcon').fadeTo('fast', 0);});

    $('.top-button').fadeTo('fast', 0.1);
    $('.catButtonIcon').fadeTo('fast', 0);

    $('#LRUruler').hide();
    $('#unitsLRUDiv').hide();
    
    //addToCss();
    autosaveTimer = setTimeout("autoSave();", autosaveInterval);

    $('body').css('cursor', 'default');
});

/* 
 * sets the display size. size can be 'small', 'medium', 'large'.
 */
function setDisplaySize(size) {
	var new_class;
	switch (size) {
	case 'small': 
		new_class = 'small-display-size';
		break;
	case 'medium':
		new_class = 'medium-display-size';
		break;
	case 'large':
		new_class = 'large-display-size';
		break;
	default:
		return;
	}

	active_display_class = new_class;

	$(".UNIT").filter("span").removeClass("small-display-size").removeClass("medium-display-size").removeClass("large-display-size").addClass(active_display_class);
	$(".LRU").filter("span").removeClass("small-display-size").removeClass("medium-display-size").removeClass("large-display-size").addClass(active_display_class);
	$(".refUnit").filter("span").removeClass("small-display-size").removeClass("medium-display-size").removeClass("large-display-size").addClass(active_display_class);
	$("#unitsLRUDiv").removeClass("small-display-size").removeClass("medium-display-size").removeClass("large-display-size").addClass(active_display_class);
}

/*
 * sets the size of the buttons. size can be 'small', 'medium', 'large'
 */
function setButtonSize(size) {
	var new_class;
	switch (size) {
	case 'small':
		new_class = 'small-buttons';
		break;
	case 'medium':
		new_class = 'medium-buttons';
		break;
	case 'large':
		new_class = 'large-buttons';
		break;
	default:
		return;
	}

	active_button_size = new_class;
	$('.button').removeClass('small-buttons').removeClass('medium-buttons').removeClass('large-buttons').addClass(active_button_size);
}

function initHierarchy(unit) {
	buildSentenceDiv(unit);
	for (var i=0; i < orderedLinkages.length; i++) {
		displayLinkage(orderedLinkages[i]);
	}
	changeFocus(unit.units[0]);
	switchControl(true); //insert pointer in first sentence
	refreshLRU();
	for (var id=0; id < isHidden.length; id++) {
		if (isHidden[id] == true) {
			hideUnit(allUnits[id], true);
		}
	}
}
function submitDemoText() {
	var xmlCheckBox = document.getElementById("xmlCheck");
	if (xmlCheckBox.checked) {
		xmlDemo = true;
	}
	else {
		xmlDemo = false;
	}
	var unit;
	if (!xmlDemo) {
	    unit = stringToUnits(document.getElementById('textInput').value, false);
	}
	else {
		//var parentDiv = document.getElementById('textDiv'); if (parentDiv == null) {    throw "err1";      }
		parseXML(document.getElementById('textInput').value);
		unit = allUnits[0];
	}

	$("#textDiv").empty();
	demo = false;
	initHierarchy(unit);
}
/**
 * Insert a pointer in a unit DIV
 * @param unitId the identifier of the unit
 * @param where location of pointer in the unit DIV
 */
function insertPointer() {
    /*if (right_to_left && pointerLoc == 0 && pointerUnit) {
        pointerLoc = pointerUnit.units.length;
    }*/
	var unitSent = document.getElementById('sentSpan' + pointerUnit.id);
	var pointerContainer = document.createElement('span');
	pointerContainer.setAttribute('id', 'pointerContainer');
	var pointerArrow = document.createElement('span');
	pointerArrow.setAttribute('id', 'pointer');
	pointerArrow.setAttribute('class', active_display_class);
	var text = document.createTextNode("|");
	pointerArrow.appendChild(text);
	pointerContainer.appendChild(pointerArrow);
	if (pointerUnit.isUnitGroup) {
		var start = 0;
		var i = 0;
		while (pointerLoc >= start) {
			var curPart = pointerUnit.parts[i++];
			if (curPart == undefined) {
			    pointerLoc = pointerLoc - 1;
			}
			else {
				start += curPart.length() + 1;
			}
		}
		unitSent.insertBefore(pointerContainer, unitSent.childNodes[2 * pointerLoc - i + 1]);
	}
	else {
		unitSent.insertBefore(pointerContainer, unitSent.childNodes[2 * pointerLoc]);	
	}
	if (pointerLoc == pointerUnit.units.length) {
		$('#pointer').addClass('pointerEndLine');
	}
	else {
		$('#pointer').removeClass('pointerEndLine');
	}
	clearTimeout(t);
	t = setTimeout("flicker(false);", 750);
}
/**
 * Removes the pointer from wherever it is
 */
function removePointer() {
	var pointer = document.getElementById('pointerContainer');
	if (pointer != null) {
		pointer.parentNode.removeChild(pointer);
		clearTimeout(t);
	}
}
/**
 * Make the pointer flicker
 * @param show
 */
function flicker(show) {
	if (!control) {
		return;
	}
	var pointer = document.getElementById('pointer');
	if (pointer != null) {
		if (show) {
			pointer.setAttribute('style', 'visibility: visible;');
		}
		else {
			pointer.setAttribute('style', 'visibility: hidden;');
		}
		t = setTimeout("flicker(" + !show + ");", 750);
	}
}

function autoSave() {
    if (allUnits[0]) {
    	var currXML = createXML(passageID);
	if (currXML != prevXML) {
		prevXML = currXML;
		save(true);
	}
	autosaveTimer = setTimeout("autoSave();", autosaveInterval);
    }
}
/**
 * Gets the first child of this unit that is a node div.
 */
function getFirstNodeDiv(parentDiv) {
	var x = parentDiv.getElementsByTagName("div");
	for (var i=0; i < x.length; i++) {
		var ID = x[i].getAttribute('id');
		if (ID != null && ID.indexOf('nodeDiv') >= 0) {
			return x[i];
		}
	}
	return null;
}

/**
 * Builds a unit-node div and displays a sentence.
 * nextLinkerArgId should be defined only if a linkage arg is to be builded.
 * It should be the id of the last linked arg which was inputted to this unit. It should be null if this is the first linked arg.
 * @param unit the Unit representing the sentence.
 */
function buildSentenceDiv(unit, parent, nextLinkerArgId) {
	var nodeDiv = document.createElement('div');
	if (arguments.length < 3) {
		nodeDiv.setAttribute('id','nodeDiv' + unit.id);
	}
	if (arguments.length > 1 && (unit.parent != parent || unit.implicit)) { //insertion of remote arguments
		if (parent != null && parent.isParagraph()) {
			parent = parent.parent;
		}
		var parentDiv;
		var nextDiv;
		if (arguments.length == 3) { //if linker argument
			parentDiv = document.getElementById('subsDiv' + parent.id);
			if (nextLinkerArgId == null) {
				parentDiv.insertBefore(nodeDiv, getFirstNodeDiv(parentDiv));
			}
			else {
				nextDiv = document.getElementById('nodeDiv' + nextLinkerArgId + 'linkedAt' + parent.id);
				parentDiv.insertBefore(nodeDiv, nextDiv);
			}
		}
		else {
		    parentDiv = document.getElementById('subsDiv' + parent.id);
                    if (!unit.implicit && parent.remoteUnits.length) {
			nextDiv = findPrevRemoteDiv(parent, unit);
                    }
                    else {
                        nextDiv = FIRST_FLAG;
                    }
		    if (nextDiv == null) { //error
			return;
		    }
		    if (nextDiv == FIRST_FLAG) { //indication to put it in the first position
			parentDiv.insertBefore(nodeDiv, getFirstNodeDiv(parentDiv));
		    }
		    else { //otherwise, should put it after nextDiv
			parentDiv.insertBefore(nodeDiv, nextDiv.nextSibling);
		    }
		}
	}
	else if (unit.isPassage()) {
		var parentDiv = document.getElementById('textDiv');
		parentDiv.appendChild(nodeDiv);
	}
	else {
		var parentDiv;
		if (unit.parent && unit.parent.isParagraph()) {  //if directly stems from a paragraph
			parentDiv = document.getElementById('subsDiv0');
		}
		else { //if further down the tree
			if (unit.parent && unit.parent.unitGroup == null) {
				parentDiv = document.getElementById('subsDiv' + unit.parent.id);
			}
			else {
				parentDiv = document.getElementById('subsDiv' + unit.parent.unitGroup.id);
			}
		}
		var nextDiv = findNextDisplayedDiv(unit);
		parentDiv.insertBefore(nodeDiv, nextDiv);
	}
	var sentDiv = document.createElement('div');
	var sentSpan;
	if (arguments.length == 3) { //if it's linkage
		sentDiv.setAttribute('id', 'sentDiv' + unit.id + 'linkedAt' + parent.id);
		sentDiv.setAttribute('class', 'link');
	}
	else {
		sentDiv.setAttribute('id', 'sentDiv' + unit.id);
	}
	sentDiv.setAttribute('style', 'position: relative; padding-right: 20px; padding-bottom: 3px;');
	nodeDiv.appendChild(sentDiv);
	if (arguments.length == 1 || unit.parent == parent) {
		var subsentDiv = document.createElement('div');
		subsentDiv.setAttribute('id', 'subsentDiv' + unit.id);
		var subsDiv = document.createElement('div');
		subsDiv.setAttribute('id', 'subsDiv' + unit.id);
            if (right_to_left) {
		subsDiv.setAttribute('style', 'position: relative; margin-left: 20px; right: 20px;');
            }
            else {
		subsDiv.setAttribute('style', 'position: relative; margin-right: 20px; left: 20px;');
            }
		subsentDiv.setAttribute('style', 'display: none;');
		nodeDiv.appendChild(subsentDiv);
		subsentDiv.appendChild(subsDiv);
		nodeDiv.setAttribute('id', 'nodeDiv' + unit.id);
		addBracket(subsDiv);
		var pImg = document.createElement('img');
		pImg.setAttribute('id', 'plusImg' + unit.id);
		pImg.setAttribute('src', 'gif/plus.gif');
		pImg.setAttribute('onmousedown', 'toggleSubsent(' + unit.id + ')');
                if (right_to_left) {
   		    pImg.setAttribute('style',
		                      'display: inline; position: absolute; right: -8px; margin-top: 3px;');
                }
                else {
   		    pImg.setAttribute('style',
		                      'display: inline; position: absolute; left: -8px; margin-top: 3px;');
                }            
		var mImg = document.createElement('img');
		mImg.setAttribute('id', 'minusImg' + unit.id);
		mImg.setAttribute('src', 'gif/minus.gif');
		mImg.setAttribute('onmousedown', 'toggleSubsent(' + unit.id + ')');
                if (right_to_left) {
		    mImg.setAttribute('style',
		                      'display: inline; position: absolute; right: -8px; margin-top: 3px;');
                }
                else {
		    mImg.setAttribute('style',
		                      'display: inline; position: absolute; left: -8px; margin-top: 3px;');
                }            

		nodeDiv.appendChild(pImg);
		nodeDiv.appendChild(mImg);

		nodeDiv.appendChild(sentDiv);
		nodeDiv.appendChild(subsentDiv);
		$("#plusImg" + unit.id).hide();
		$("#minusImg" + unit.id).hide();
		if (!unit.implicit && unit.isPassage()) {
			sentDiv.setAttribute('class', 'sentence passageSentence');
			for (var i = 0; i < unit.units.length; i++) {
				var p = document.createElement('p');
				p.setAttribute('class','paragraph');
                                if (right_to_left == true) {
                                    p.setAttribute('class','paragraph rightToLeft');
                                }
				sentDiv.appendChild(p);
				sentSpan = document.createElement('span');
				p.appendChild(sentSpan);
				displaySentence(unit.units[i],sentSpan);
				displaySubunits(unit.units[i],subsDiv);
			}
			$("#sentDiv"+unit.id).addClass("passageShadow");
			return;
		}
	}
	if (!unit.implicit && arguments.length < 3 && (!unit.isParagraph() && !unit.isPassage())) {
	    var square = document.createElement('div');
	    if (unit.parent != parent && arguments.length > 1) {
		var remoteInd = parent.remoteUnits.indexOf(unit);
		square.setAttribute('class', 'square '+UNITTYPE[parent.remoteTypes[remoteInd]].code+'bg square'+unit.id+'at'+parent.id);
                square.setAttribute('title', UNITTYPE[parent.remoteTypes[remoteInd]].name);
	    }
	    else {
		square.setAttribute('class', 'square '+UNITTYPE[unit.type].code+'bg square'+unit.id);
                square.setAttribute('title', UNITTYPE[unit.type].name);
	    }
	    square.setAttribute('onmousedown', 'squareIcon('+unit.id+')');
	    sentDiv.appendChild(square);
	}
	else if (unit.implicit) {
		var square = document.createElement('div');
		var impType = parent.remoteTypes[parent.remoteUnits.indexOf(unit)];
		square.setAttribute('class', 'square '+UNITTYPE[impType].code+'bg square'+unit.id+'at'+parent.id);
            square.setAttribute('title', UNITTYPE[impType].name);
		sentDiv.appendChild(square);
	}
	if (!unit.implicit && arguments.length < 3 && !unit.isParagraph() && !unit.isPassage() && (arguments.length == 1 || unit.parent == parent)) {
		var utilButtons = document.createElement('div');
            if (right_to_left) {
		utilButtons.setAttribute('style', 
		                         'display: inline; position: absolute;  left: 3px; top: 3px; z-index: 200;');
            }
            else {
		utilButtons.setAttribute('style', 
		                         'display: inline; position: absolute;  right: 3px; top: 3px; z-index: 200;');
            }
		var commentsButton = document.createElement('img');
		commentsButton.setAttribute('id', 'comments' + unit.id);
		commentsButton.setAttribute('class', 'commentsButton');
		commentsButton.setAttribute('src', 'gif/comments.gif');
		commentsButton.setAttribute('title', 'alt+m: write comments on this unit');
		commentsButton.setAttribute('onclick', 'openRemarksDialog('+unit.id+')');
		utilButtons.appendChild(commentsButton);

		var delImg = document.createElement('img');
		delImg.setAttribute('id', 'delImg' + unit.id);
		delImg.setAttribute('class', 'delImg');
		delImg.setAttribute('src', 'gif/del_icon.png');
		delImg.setAttribute('onclick', 'delButton('+unit.id+')');
		delImg.setAttribute('style', 'display: inline-block; cursor: pointer; max-height: 0.8em; max-width: 1em;');
		delImg.setAttribute('title', 'del: delete this unit');
		utilButtons.appendChild(delImg);

		var finishButton  = document.createElement('img');
		finishButton.setAttribute('id', 'finishB'+ unit.id);
		finishButton.setAttribute('class', 'finishButton');
		finishButton.setAttribute('src', 'gif/F.gif');
		finishButton.setAttribute('onclick', 'finish('+unit.id+')');
		finishButton.setAttribute('title', 'alt+f: declare this this unit finished');
		finishButton.setAttribute('style',
		'display: inline; max-height: 0.8em; max-width: 1em; cursor: pointer; position: relative;');
		utilButtons.appendChild(finishButton);      
		sentDiv.appendChild(utilButtons);      

	}
        else if ((arguments.length == 2 && unit.parent != parent) || unit.implicit) {
		var utilButtons = document.createElement('div');
		utilButtons.setAttribute('style', 
		                         'display: inline; position: absolute;  right: 3px; top: 3px; z-index: 200;');
		var delImg = document.createElement('img');
		delImg.setAttribute('id', 'delImg' + unit.id + 'at' + parent.id);
		delImg.setAttribute('class', 'remoteDelImg delImg');
		delImg.setAttribute('src', 'gif/del_icon.png');
		delImg.setAttribute('onclick', 'delButton('+unit.id+','+ parent.id +')');
		delImg.setAttribute('title', 'del: cancel this remote unit');
		delImg.setAttribute('style', 'display: inline-block; cursor: pointer; max-height: 0.8em; max-width: 1em;');
		utilButtons.appendChild(delImg);
		sentDiv.appendChild(utilButtons);
	}
    /*
	if (arguments.length == 4) {

		var linkIcon = document.createElement('img');

		linkIcon.setAttribute('src', 'gif/link.png');
		linkIcon.setAttribute('style', 'vertical-align: middle;');
		linkIcon.setAttribute('id', 'linkIcon'+unit.id+'linkedAt'+parent.id);
		sentDiv.appendChild(linkIcon);

        linkIcon.setAttribute('title', "LINKS (1) '" + unit.first.toString() + "' and (2) '" + unit.second.toString()+ "'");


        $('#linkIcon'+unit.linker.id).mouseover(function(e) {
            var linkerId = e.target.id.substring(8);
            $(".unitSpan"+allUnits[linkerId].linkages[0].first.id).addClass("linkageUnit");
            $("#sentDiv"+allUnits[linkerId].linkages[0].first.id).addClass("linkageSentDiv");
            if (allUnits[linkerId].linkages[0].second != EMPTY_ARGUMENT) {
                $(".unitSpan"+allUnits[linkerId].linkages[0].second.id).addClass("linkageUnit");
                $("#sentDiv"+allUnits[linkerId].linkages[0].second.id).addClass("linkageSentDiv");
            }
            $(".unitSpan"+allUnits[linkerId].id).addClass("linkageUnit");
        });

        $('#linkIcon'+unit.linker.id).mouseleave(function(e) {
            var linkerId = e.target.id.substring(8);
            $(".unitSpan"+allUnits[linkerId].linkages[0].first.id).removeClass("linkageUnit");
            $("#sentDiv"+allUnits[linkerId].linkages[0].first.id).removeClass("linkageSentDiv");
            if (allUnits[linkerId].linkages[0].second != EMPTY_ARGUMENT) {
                $(".unitSpan"+allUnits[linkerId].linkages[0].second.id).removeClass("linkageUnit");
                $("#sentDiv"+allUnits[linkerId].linkages[0].second.id).removeClass("linkageSentDiv");
            }
            $(".unitSpan"+allUnits[linkerId].id).removeClass("linkageUnit");
        });
	}
    */

	sentSpan = document.createElement('span');
	sentDiv.appendChild(sentSpan);
	if (arguments.length > 1 && (unit.parent != parent || unit.implicit)) {
		if (arguments.length == 3) { //linkage
			displaySentence(unit,sentSpan,parent);
			nodeDiv.setAttribute('id', 'nodeDiv' + unit.id + 'linkedAt' + parent.id);
			nodeDiv.setAttribute('class', 'link');
			sentDiv.setAttribute('class', 'link sentence');
			$("#"+sentSpan.getAttribute("id")).fadeTo(200, 0.4, null);
		}
		else {
			displaySentence(unit,sentSpan,parent);
			nodeDiv.setAttribute('id','nodeDiv' + unit.id + 'at' + parent.id);
			sentDiv.setAttribute('id','sentDiv' + unit.id + 'at' + parent.id);
			sentDiv.setAttribute('class', 'unedittableSentence');
			sentDiv.setAttribute('onmouseover', "$('.unitSpan"+unit.id+"').addClass('originalRemoteInstance')");
			sentDiv.setAttribute('onmouseout', "$('.unitSpan"+unit.id+"').removeClass('originalRemoteInstance')");

			$("#"+sentSpan.getAttribute("id")).fadeTo(200, 0.4, null);
		}
	}
	else {
		sentDiv.setAttribute('class', 'sentence');
		displaySentence(unit,sentSpan);
		displaySubunits(unit);
		if (unit.unanalyzable) {
			$("#sentDiv"+unit.id).addClass("unanalyzable");
		}
		if (unit.uncertain) {
			$("#sentDiv"+unit.id).addClass("uncertain");
		}
		if (unit.referent) {
			displayReferent(unit);
		}
	}
	//adding shadows
	sentDiv.setAttribute('class', sentDiv.getAttribute('class')+' unitShadow');
    if (right_to_left) {
        sentDiv.setAttribute('class', sentDiv.getAttribute('class')+' rightToLeft');
    }
}

/**
 * Adds a bracket div to a given div. The bracket div is used for displaying
 * unit trees.
 * @param div
 */
function addBracket(div) {
    var bracketDiv = document.createElement('div');
    var bracket = document.createElement('div');
    bracket.setAttribute('class', 'bracket');
    bracketDiv.appendChild(bracket);
    if (right_to_left) {
        bracket.setAttribute('class', 'bracket bracket_rightToLeft');
        bracketDiv.setAttribute('class', 'bracketDiv bracketDiv_rtl');
    } else {
        bracket.setAttribute('class', 'bracket bracket_leftToRight');
        bracketDiv.setAttribute('class', 'bracketDiv bracketDiv_ltr');
    }
    div.insertBefore(bracketDiv, div.firstChild);
}

/**
 * The functionality of pressing the square div.
 */
function squareIcon(id) {
	if (remoteAdd != null) {
		checkAndAddRemote(id);
	}
	else if (refAdd != null) {
		checkAndAddReferent(id);
	} 
	else {
		jump(id);
	}
}
/**
 * Hides/shows the bracket.
 */
function hideBracket() {
	$(".bracketDiv").hide();
}
function showBracket() {
	$(".bracketDiv").show();
}
/**
 * Displays a unit with all its subunits
 * @param sentSpan the span in which the sentence will be displayed
 * @param unit the unit to display
 */
function displaySentence(unit,sentSpan,remoteOf) {
	while (sentSpan.hasChildNodes()) {
		sentSpan.removeChild(sentSpan.lastChild);
	}
	if (!unit.isLink && !unit.implicit && (unit == pointerUnit || unit.isParagraph())) {
		sentSpan.setAttribute('style', 'left: 5px;');
	}
	else { // if (!unit.isLink && !unit.implicit && !unit.isParagraph()){
		sentSpan.setAttribute('style', 'left: 5px; opacity: 0.4; filter:alpha(opacity=40);');
	}
	if (arguments.length == 3) {
		sentSpan.setAttribute('id', 'sentSpan' + unit.id + 'at' + remoteOf.id);
		sentSpan.setAttribute('class', 'UNIT '+active_display_class);
	}
	else {
		sentSpan.setAttribute('id', 'sentSpan' + unit.id);
		sentSpan.setAttribute('class', 'sentSpan');
	}
	if (unit.isUnitGroup) {
		for (var j = 0; j < unit.parts.length; j++) {
			if (j > 0) {
				insertEllipsis(sentSpan, "el" + unit.id + "no" + j);
			}
			sentencePart(unit.parts[j],sentSpan,(arguments.length == 3));
		}
	}
	else {
		sentencePart(unit,sentSpan,(arguments.length == 3));
	}
}
function sentencePart(unit, sentSpan,oneUnit) {
	if (oneUnit) {
		createUnitSpan(unit,sentSpan,false);
		return;
	}
	for (var i = 0; i < unit.units.length; i++) {
		createUnitSpan(unit.units[i],sentSpan,true);
		var space = document.createTextNode(" ");
		sentSpan.appendChild(space);
	}
}
/**
 * Insert an ellipsis ("...") in a given span.
 * @param span the span in which the ellipsis is inserted
 * @param id ellipsis id
 */
function insertEllipsis (span, id) {
	innerSpan = document.createElement('span');
	innerSpan.setAttribute('id', id);
	innerSpan.setAttribute('style', 'color: #bbbbbb');
	innerSpan.appendChild(document.createTextNode(ELIPSIS_SYMBOL));
	span.appendChild(innerSpan);

}
/**
 * Displays a given unit's subunits in the subunits div, in the form of a
 * tree.
 * @param unit
 * @returns
 */
function displaySubunits(unit,subsDivId) {
	if (arguments.length == 1 && unit.unitGroup == null) {
		var subsDiv = document.getElementById('subsDiv' + unit.id);
		while (subsDiv.hasChildNodes()) {
			subsDiv.removeChild(subsDiv.firstChild);
		}
		addBracket(subsDiv);
	}
	var subUnitDisplayed = false;
	if (unit.unitGroup == null) {
		subUnitDisplayed = iterateOverArrayAndDisplay(unit.remoteUnits,unit,false) || subUnitDisplayed;
	}
	if (unit.isUnitGroup) {
		for (var i = 0; i < unit.parts.length; i++) {
			subUnitDisplayed = displaySubunits(unit.parts[i]) || subUnitDisplayed;
		}
	}
	else {
		subUnitDisplayed = iterateOverArrayAndDisplay(unit.units,unit,true) || subUnitDisplayed;
	}
	if (subUnitDisplayed && unit.unitGroup == null) {
		showSubtree(unit.id);
	}
	return subUnitDisplayed;
}
function iterateOverArrayAndDisplay(arr,unit,edittable) {
	var subUnitDisplayed = false;
	for (var i=0; i < arr.length; i++) {
		if (arr[i].unitGroup == null) {
			if (!edittable) {
				buildSentenceDiv(arr[i],unit);
				subUnitDisplayed = true;
			}
			else if (arr[i].display) {
				buildSentenceDiv(arr[i]);
				subUnitDisplayed = true;
			}
		}
		else if (arr[i].unitGroup != null &&
				arr[i].unitGroup.parts[0] == arr[i]) {
			subUnitDisplayed = true;
			if (edittable) {
				buildSentenceDiv(arr[i].unitGroup);
			}
			else {
				buildSentenceDiv(arr[i].unitGroup);
			}
		}
	}
	return subUnitDisplayed;
}
/**
 * Create a span for a unit for display in the unit's parent's sentence span.
 * @param unit the unit to display
 * @param parentSpan the parent's sentence span
 * @param unitStack used for displaying the unit between separate parts of non-contiguous units.
 * @returns
 */
function createUnitSpan(unit, parentSpan,functional) {
	var newSpan = document.createElement('span');
	parentSpan.appendChild(newSpan);
	var text;
	var index = -1;
	if (unit.isLink) {
		text = document.createTextNode(unit.linkerText());
	}
	else {
		unitText = unit.toString();
		var r = /\\u([\d\w]{4})/gi;
		unitText = unitText.replace(r, function (match, grp) {
			return String.fromCharCode(parseInt(grp, 16)); } );
		text = document.createTextNode(unescape(unitText));
		if (unit.unitGroup != null) {
			index = unit.unitGroup.parts.indexOf(unit);
			unit = unit.unitGroup;
		}
	}
	newSpan.appendChild(text);
	if (functional) {
		if (unit.parent != null && ((unit.parent.unitGroup == null && unit.parent.head == unit) ||
				(unit.parent.unitGroup != null && unit.parent.unitGroup.head == unit))) {
			newSpan.setAttribute('class','UNIT unitSpan'+unit.id+' '+UNITTYPE[unit.type].code+'border head '+active_display_class);
		}
		else {
			newSpan.setAttribute('class','UNIT unitSpan'+unit.id+' '+UNITTYPE[unit.type].code+'border '+active_display_class);
		}
		if (index != -1) {
			newSpan.setAttribute('onmouseover', 'return mouseover('
					+ unit.id + ', event, true, ' + index  +')');
			newSpan.setAttribute('onmouseout', 'return mouseover('
					+ unit.id + ', event, false, ' + index  +')');
			newSpan.setAttribute('onmouseup', 'return mouseup('
					+ unit.id + ', ' + index  +',event);');
		}
		else {
			newSpan.setAttribute('onmouseover', 'return mouseover('
					+ unit.id + ', event, true)');
			newSpan.setAttribute('onmouseout', 'return mouseover('
					+ unit.id + ', event, false)');
			newSpan.setAttribute('onmouseup', 'return mouseup('
					+ unit.id + ',-1,event);');
		}
		newSpan.setAttribute('onmousedown', 'return mousedown('
				+ unit.id + ', ' + index + ',event);');
		newSpan.setAttribute('ondblclick', 'return mousedblclick('+unit.id + ',event);');

		if (unit.implicit) {
			newSpan.setAttribute('class','UNIT implicit '+active_display_class);
		}
	}
	return newSpan;
}
function mousedblclick(id,e) {
	toggleLRUSelectMode(false);
	switchControl(true);
	edit(allUnits[id]);
	jump(id);
}
function mousedown(id,index,e) {
	toggleLRUSelectMode(false);
	switchControl(true);
	focusUnit = null;
	if (dialog == 3) {
		var unit = allUnits[id];
		deselect();
		toggleSelect(unit, true);
		pointerLoc = calcPointerLoc(unit);
		return;
	}
	if (anchorUnit != null && remoteAdd == null && refAdd == null) {
		if (e.shiftKey) {
			focusUnit = allUnits[id];
			if (focusUnit.isUnitGroup) {
				focusUnit = focusUnit.parts[index];
			}
			if (!selectBetween(anchorUnit,focusUnit)) {
				deselect();
				selecting = true;
				anchorUnit = focusUnit;
				toggleSelect(focusUnit);
			}
			return;
		}
		else if (e.ctrlKey) {
			focusUnit = allUnits[id];
			if (focusUnit.isUnitGroup) {
				focusUnit = focusUnit.parts[index];
			}
			selecting = !isSelected(focusUnit);
			if (focusUnit.parent == anchorUnit.parent) {
				anchorUnit = focusUnit;
				selectBetween(anchorUnit, focusUnit, selecting, true);
			}
			return;
		}
	}
	deselect();
	anchorUnit = allUnits[id];
	if (anchorUnit.isUnitGroup) {
		anchorUnit = anchorUnit.parts[index];
	}
	if (remoteAdd == null && refAdd == null) {
		selecting = true;
	}
	if (anchorUnit.parent.unitGroup == null && anchorUnit.parent != pointerUnit) {
		changeFocus(anchorUnit.parent);
	}
	else if (anchorUnit.parent.unitGroup != null && anchorUnit.parent.unitGroup != pointerUnit) {
		changeFocus(anchorUnit.parent.unitGroup);				
	}
	if (remoteAdd != null || refAdd != null) {
		toggleSelect(anchorUnit,true);
	}
	else {
		toggleSelect(anchorUnit,true,true);
	}
}
function mouseup(id,index,e) {
	if (id == -1) {
		if (tempSelectedUnits.length > 0) {
			mouseup(tempSelectedUnits[tempSelectedUnits.length-1].id);
		}
		return;
	}
	focusUnit = allUnits[id];
	if (focusUnit.isUnitGroup && arguments.length == 2) {
		focusUnit = focusUnit.parts[index];
	}
	switch (dialog) {
	case 0:
		if (remoteAdd == null && refAdd == null) {
			if (anchorUnit != null) {
				if (arguments.length == 3 && e.shiftKey) {
					selectBetween(anchorUnit, focusUnit, true);
					return;
				}
				if (!selectBetween(anchorUnit, focusUnit,!isSelected(anchorUnit))) {
					deselect();
					anchorUnit = null;
				}
				else {
					selectTemp();
					selecting = false;
				}
				pointerLoc = calcPointerLoc(focusUnit) + 1;
				removePointer();
				insertPointer();
			}
		}
		else if (remoteAdd != null) {
			if (id == selectedUnits[0].id) {
				checkAndAddRemote(id);
			}
		}
		else if (refAdd != null) {
			checkAndAddReferent(id);
		}
		break;
	case 3:
		selectTemp();
		selecting = false;
		break;
	}
}

/**
 * This is what happens when you press the del button. The second argument is relevant for remote units and 
 * is the id of the unit in which the remote unit is referred to.
 */
function delButton(unitToDelete, parentId) {
	//if in referent selection mode, del deletes the current referent.
	if (refAdd != null) {
		if (refAdd == pointerUnit && refAdd.referent != null) {
			removeReference();
			toggleAddReferent(null);
		}
		return;
	}
	if (arguments.length == 0) {
		unitToDelete = pointerUnit;
	}
	else {
		unitToDelete = allUnits[unitToDelete];
	}
	if (arguments.length == 2) {
		removeRemoteUnit(allUnits[parentId], unitToDelete);
		changeFocus(allUnits[parentId]);
		deselect();
		$('.originalRemoteInstance').removeClass('originalRemoteInstance');
		if (remoteAdd != null) {
			toggleRemoteAdd(null);
		}
	}
	else if (refAdd == null && remoteAdd == null && 
			!unitToDelete.isPassage() && !unitToDelete.isParagraph())  {
		changeFocus(unitToDelete.parent);
		toggleSelect(unitToDelete, true, false);
		ungroupIfNotRemoteUnit(singleUnitSelected() == 1);
	}
}

/**
 * Detect keyboard activity
 * @param e the keyboard event
 */
function keyPress(e) {

	if (demo)  {
		return;
	}
	var keynum = 0;
	if(window.event) // IE
	{
		keynum = e.keyCode;
	}
	else if(e.which) // Netscape/Firefox/Opera
	{
		keynum = e.which;
	}
	if (dialog == 0 && !e.ctrlKey && !e.altKey && keyboardShortcuts[keynum]) { //category shortcuts
		keynum = keyboardShortcuts[keynum];
	}

	if (dialog == 4) {
		if (keynum == 27) {
			closeDialog();
			areThereCandidates = false;
		}
		setLinkageFinish(keynum);
		return;
	}
	if (dialog == 6) {
		if (keynum == 27) {
			saveRemarks();
			closeDialog();
		}
		return;
	}
	switch (keynum) {
	case 9: //tab
	e.preventDefault();
	if (remoteAdd != null || refAdd != null) {
		if (!cursorInLRU) {
			openLRUtable(true);
			toggleLRUSelectMode(true);
			lruScrollToPointer();
		}
		else {
			toggleLRUSelectMode(false);
		}
	}
	break;
	case 13: //enter
		e.preventDefault();
		if (remoteAdd != null) {
			if (cursorInLRU) {
				checkAndAddRemote(lruQueue[lruCursorIndex].id);
				toggleLRUSelectMode(false);
			}
			else {
				checkAndAddRemote();
			}
		}
		else if (mode=="basic" && refAdd != null) {
			spacebar();
		}
		break;
	case 27: //esc
		if (isMoreButtonsMenu) {
			closeMoreButtonsMenu();
		}
		if (dialog) {
			closeDialog();
		}
		else if (remoteAdd != null) {
			toggleRemoteAdd(null);
		}
		else if (refAdd != null) {
			toggleAddReferent(null);
		}
		break;
	case 32: //spacebar
		if (mode=="basic") {
		e.preventDefault();
		spacebar();
		}
		break;
	case 33: //page up
		e.preventDefault();
		if (dialog == 7) {
			scrollHelpDialog(true, true);
		}
		break;
	case 44: //page down
		e.preventDefault();
		if (dialog == 7) {
			scrollHelpDialog(false, true);
		}
		break;
	case 37: //left arrow
		e.preventDefault();
		if (!cursorInLRU) {
			arrow(false,e);
		}
		break;
	case 38: //up arrow
		e.preventDefault();
		if (!dialog && !e.shiftKey && cursorInLRU) {
			switchLRUSent(false);
		}
		else {
			switchControl(true);
			if (!dialog) {
				if (!e.shiftKey) {
					remoteAddSwitchSent(false);
					if (remoteAdd == null && control) {
						removePointer();
						insertPointer();
					}
				}
				else {
					switchLRUSent(false);
				}
			}
			else if (dialog == 7) {
				scrollHelpDialog(true);
			}
		}
		break;
	case 39: //right arrow
		e.preventDefault();
		if (!cursorInLRU) {
			arrow(true,e);
		}
		break;
	case 40: //down arrow
		e.preventDefault();
		if (!dialog && !e.shiftKey && cursorInLRU) {
			switchLRUSent(true);
		}
		else {
			switchControl(true);
			if (!dialog) {
				if (!e.shiftKey) {
					remoteAddSwitchSent(true);
				}
				else {
					switchLRUSent(true);
				}
			}
			else if (dialog == 7) {
				scrollHelpDialog(false);
			}
		}
		break;
	case 46: //del
		delButton();
		break;
	case 65: //a
		e.preventDefault();
		if (mode=="basic" && e.altKey) {
			finishAll();
		}
		break;
	case 66: //b
		e.preventDefault();
		if (e.altKey) {
			checkAndSubmit();
		}
		break;  
	case 67: //c
		if (mode=="review" && e.altKey) {
			union();
		}
		break;
	case 69: //e
		e.preventDefault();
		if (mode=="basic" && e.altKey) {
			edit();
		}
		break;
	case 70: //f
		e.preventDefault();
		if (mode=="basic" && e.altKey) {
			finish();
		}
		break;
	case 72: //h
		e.preventDefault();
		if (e.altKey) {
			window.location = "/";
		}
		break;        
	case 73: //i
		if (mode=="basic" && e.altKey && remoteAdd) {
			addImplicitUnit();
		}
		break;
	case 76:  //l
		if (mode=="basic" && e.altKey) {
			createOrRemoveLinkage(selectedUnits);
			//toggleAddLinkageMode();
		}
		break;
	case 77: //m
		e.preventDefault();
		if (e.altKey) {
			if (!pointerUnit.isParagraph() && !pointerUnit.isPassage()) {
				openRemarksDialog(pointerUnit.id);
			}
		}
		break;        
	case 78: //n
		switch (dialog) {
		case 0:
			if (e.altKey) {
				e.preventDefault();
				reportUnfit();
			}
			break;
		case 2:
			YNdialogAnswer(false);
			break;
		case 3:
			headDialogNone();
			break;
		}
		break;
	case 80: //p
            // TEMPORARILY CANCELED
	    //e.preventDefault();
	    //if (mode=="basic" && e.altKey) {
	    //	checkAndEnterRefMode();
	    //}
		break;
	case 82: //r
		if (!dialog) {
			if (e.altKey) {
				openRemarksDialog();
			}
		}
		break;
	case 83: //s
		e.preventDefault();
		if (mode=="basic" && (e.altKey || e.ctrlKey)) {
			save(false);
		}
		break;
	case 84: //t
		if (mode=="basic" && e.altKey) {
			openDialog(8);
		}
		break;        
	case 85: //u
		if (mode=="basic" && e.altKey) {
			setUncertainAnnotation();
		}
		break;
	case 88: //x
		if (e.altKey && !dialog) {
			openDialog(2, "Are you sure you want to reset?", loadPassage, [passageID, true]);
		}
		else if (e.shiftKey && !dialog) {
			openDocsDialog('local', "<textarea style='width: 80%; height: 15em; left: 1em; position: absolute;'>"+createXML(passageID)+"</textarea>");
		}
		break;
	case 89: //y
		if (dialog == 2) {
			YNdialogAnswer(true);
		}
		break;
        case 90: //z
            if (e.altKey && !dialog) {
                setUnanalyzable();
            }
            break;
	case 113:
	    openDocsDialog('local', HELP_SCREEN_HTML);
            $("."+username+"Review").show()
	    break;
	case 191: //forward slash
		if (e.shiftKey && !dialog) { //question mark
			openDialog(1);
		}
		break;
	default:
		if (mode=="basic" && !dialog) {
			if (e.shiftKey) {
				if (keynum in UNITTYPE && UNITTYPE[keynum].code != "FUNCTION") {
					checkAndChooseRemoteUnits(keynum);
				}
			}
			else {
				checkAndSetUnitType(keynum);
			}
		}
	}
}
/**
 * Sets the type of a selected unit, according to the key pressed.
 * @param keynum the number representation of the key pressed.
 */
function checkAndSetUnitType(keynum) {

	if (!(keynum in UNITTYPE && UNITTYPE[keynum].display)) {
		return;
	}
	var unitName2 = UNITTYPE[keynum];
	if (remoteAdd != null || refAdd != null) {
		return;
	}
	var unit = null;
	var singleUnit = singleUnitSelected();

	if (selectedUnits.length == 0) {
		if (pointerUnit != undefined && !pointerUnit.isParagraph()) {
			unit = pointerUnit;
		}
		else {
			return;
		}
	}
	else {
		if (pointerUnit.unanalyzable) {
			printUserMessage("Cannot group - Unit unanalyzable.");
			return;
		}
		if (singleUnit == 1) {
			if(!unitName2.refinedFrom) {
                            console.log('3');
				unit = group();
				if (unit == null) {
					return;
				}
			}
			else{
				unit = selectedUnits[0];
                            console.log('2');
			}
		}
		else if (singleUnit == -1) {
                    console.log('4');
			unit = selectedUnits[0].unitGroup;
			if (unit instanceof Atom) {
				unit = unit.parent;
			}
		}
		else  { //If there are many units selected.
                    console.log('6');
			unit = group();
			if (unit == null) {
				return;
			}
		}
	}
    console.log('after');
    var unitName1 = UNITTYPE[unit.type];
	if (unit.type != 1 && (!unit.defaultType || unit.parent.head == unit)) {
		if (!UNITTYPE[unit.type].changable) {
			printUserMessage("The type "+UNITTYPE[unit.type].name+" is not changable.");
		}
		else if (unit.type != keynum) {
			if ((unit.parent.unitGroup == null && unit.parent.head == unit) ||
					(unit.parent.unitGroup != null && unit.parent.unitGroup.head == unit)) {
				printUserMessage("Can't change type of a unit's head.");
				return;
			}
			if (unitName2.refinedFrom && unitName2.refinedFrom != null && unitName2.refinedFrom != unitName1.code){
				printUserMessage("Can't refine "+unitName1.name+" into "+unitName2.name+".");
			}
			openDialog(2, "Are you sure you want to change unit type from<br> <div style='margin-right: 7px;' class='square " + unitName1.code + "bg'></div>" +
					unitName1.name + " to <div style='margin-right: 7px;' class='square " + unitName2.code + "bg'></div>" + unitName2.name + 
					"?", setUnitType,[unit.id,keynum,singleUnit]);
		}
		else {
			printUserMessage("Unit type is already " +
					UNITTYPE[unit.type].name + ".");
		}
	}
	else {
		if (!unitName2.refinedFrom || unitName2.refinedFrom == null || unitName2.refinedFrom == unitName1.code) {
			setUnitType(unit.id,keynum,singleUnit);
		}
	}
}
function setUnitType(id,type,singleUnit,head) {
	if (arguments.length < 4) {
		head = false;
	}
	var unit = allUnits[id];
	//if (type != unit.type) {
	//removeAllRemoteUnits(unit);
	//}
	if (UNITTYPE[unit.type].headed) {
		if (unit.head != null) {
			if (UNITTYPE[type].headed) {
				setUnitType(unit.head.id, type, unit.head.isUnitGroup ? -1 : 1, true);
			}
			else {
				$(".UNIT.unitSpan" + unit.head.id).removeClass("head");
			}
		}
	}
	unit.setType(type);
	if (!unit.display && !head) {
		expandCurrent(singleUnit);
	}
	enqueueToLRU(unit);
	refreshUnitSpan(unit);
	deselect();
}

function refreshUnitSpan(unit) {
	if (unit != null) {
	    $(".square" + unit.id).removeClass().addClass(
		"square " + UNITTYPE[unit.type].code + "bg square" + unit.id);
            $(".square" + unit.id).attr('title', UNITTYPE[unit.type].name);
	    $(".UNIT.unitSpan" + unit.id).removeClass().addClass(
		UNITTYPE[unit.type].code + "border UNIT unitSpan" + unit.id+" "+active_display_class);
	    if ((unit.parent.unitGroup == null && unit.parent.head == unit) ||
		(unit.parent.unitGroup != null && unit.parent.unitGroup.head == unit)) {
		$(".UNIT.unitSpan" + unit.id).addClass('head');
	    }
	    $(".lruSquare" + unit.id).removeClass().addClass("square " +
				                             UNITTYPE[unit.type].code + "bg lruSquare" + unit.id);
            $(".lruSquare" + unit.id).attr('title', UNITTYPE[unit.type].name);
	}
}

function refreshRemoteUnit(parent, remoteIndex) {
    var curType = parent.remoteTypes[remoteIndex];
    var remoteUnit = parent.remoteUnits[remoteIndex];
    $(".square" + remoteUnit.id + "at" + parent.id).removeClass().addClass(
	"square " + UNITTYPE[curType].code + "bg square" + remoteUnit.id + "at" + parent.id);
    $(".square" + remoteUnit.id + "at" + parent.id).attr('title', UNITTYPE[curType].name);
}

/**
 * Checks whether a single unit is selected
 * @returns {Number} 1 if a single contiguous unit is selected, -1 if a single
 * non-contiguous unit is selected, 0 otherwise
 */
function singleUnitSelected() {
	if (selectedUnits.length == 0) {
		return 0; //no unit selected
	}
	if (selectedUnits.length == 1) {
		return 1; //single contiguous unit
	}
	if (selectedUnits.length > 0) {
		if (selectedUnits[0].unitGroup == null) {
			return 0; //not a single unit;
		}
		for ( var i = 1; i < selectedUnits.length; i++) {
			if (selectedUnits[0].unitGroup != selectedUnits[i].unitGroup) {
				return 0; //not a single unit
			}
		}
	}
	return -1; //single non-contiguous unit
}
/**
 * collapses or expands the entire tree or a subtree
 * @param collapse true if collapse, false if expand
 * @param unit optional variable - if a unit is given, collapses is subtree
 */
function toggleCollapse(collapse,unit) {
	if (arguments.length == 1) {
		if (collapse && !pointerUnit.isParagraph()) {
			changeFocus(allUnits[0].units[0]);
		}
		for (var i in isUnitNodeOpen) {
			if (isUnitNodeOpen[i] == collapse) {
				toggleSubsent(i);
			}
		}
	}
	else {
		if (isUnitNodeOpen[unit.id] == collapse) {
			toggleSubsent(unit.id);
		}
	}
}

function finish(unitId) {
    if (arguments.length == 0) {
	unit = pointerUnit;
    }
    else {
	unit = allUnits[unitId];
    }
    if (unit.isParagraph()) {
	return false;
    }

    var violatingUnit = null;
    violatingUnit = unit.toggleFinished();

    if (violatingUnit != null) {
	edit(allUnits[violatingUnit.id]);
	jump(violatingUnit.id);
	return false;
    }
    else { //no violating units
        toggleCollapse(true, unit);
        if (unit.parent.isParagraph()) {
	    hideUnit(unit);
        }
	changeFocus(unit.parent);
	return true;
    }
}

function finishAll() {
	for (index in allUnits[0].units) {
		var curParagraph = allUnits[0].units[index];
		for (index2 in curParagraph.units) {
			var curUnit = curParagraph.units[index2];
			if (curUnit.unitGroup != null) {
				curUnit = curUnit.unitGroup;
			}
			if (UNITTYPE[curUnit.type].code == "TBD" || UNITTYPE[curUnit.type].code == "PUNCT") {
				continue;
			}
			if (!curUnit.isFinished) {
				var violatingUnit = curUnit.toggleFinished();
				if (violatingUnit != null) {
					edit(allUnits[violatingUnit.id]);
					jump(violatingUnit.id);
					return;
				}
			}
			hideUnit(curUnit);
		}
	}
	$('.pointerUnitHighlight').removeClass('pointerUnitHighlight');
	save(false);
	jump(1);
}

/**
 * Shows the selected unit's subtree.
 */
function expandCurrent(singleUnit) {
	var unit;
	if (!selectedUnits.length) {
		return;
	}
	switch (singleUnit) {
	case 0:
		return;
	case 1:
		unit = selectedUnits[0];
		if (unit instanceof Atom) {
			return;
		}
		break;
	default:
		unit = selectedUnits[0].unitGroup;
	}
	if (unit && !unit.display) {
		unit.setDisplayVal(true);
		expand(unit, pointerUnit);
	}
}
/**
 * Shows the given unit's subtree.
 * @param unit the given unit
 * @param parent the unit's parent
 */
function expand(unit,parent) {
	if (unit.isUnitGroup) {
		if ((unit.parts[0].parent.unitGroup == null &&
				unit.parts[0].parent != parent) ||
				(unit.parts[0].parent.unitGroup != null &&
						unit.parts[0].parent.unitGroup != parent)) {
			return;
		}
	}
	else if (unit.parent != parent && unit.parent.unitGroup != parent) {
		return;
	}
	showSubtree(parent.isParagraph() ? 0 : parent.id);
	buildSentenceDiv(unit);
}

function showSubtree(id) {
	var unit = allUnits[id];
	if (unit.isParagraph()) {
		unit = unit.parent;
	}
	if (!unit.isPassage()) {
		$('#minusImg' + unit.id).show();
	}
	$('#subsentDiv' + unit.id).show();
	isUnitNodeOpen[unit.id] = true;
}

/**
 * Finds the div of a unit's sibling that should be displayed after the unit's div. 
 * ignoreUneditable - 0 (default), 1 (ignore uneditable divs), -1 (consider only uneditable divs)
 * @param unit the given unit
 * @returns the div of the unit's sibling, before which the unit's div should be
 * inserted
 */
function findNextDisplayedDiv(unit) {
	if (unit.isUnitGroup) {
		unit = unit.parts[0];
	}
	unit = sibling(unit, true);
	while (unit != null) {
		if (isNextDisplayed(unit)) {
			var div;
			if (unit.unitGroup != null) {
				div = document.getElementById('nodeDiv' + unit.unitGroup.id);
			}
			else {
				div = document.getElementById('nodeDiv' + unit.id);
			}
			if (div != null) {
				return div;
			}
		}
		unit = sibling(unit,true);
	}
	/*
    if (unitCopy && unitCopy.parent && unitCopy.parent.remoteUnits.length) {
	var remote = unitCopy.parent.remoteUnits[0];
	if (remote.unitGroup) {
	    remote = remote.unitGroup;
	}
	return document.getElementById('nodeDiv' + remote.id + 'at' + unitCopy.parent.id);
    }
	 */
	return null;
}

/**
 * Returns the last remote div of this unit.
 */
function findPrevRemoteDiv(parent, unit) {
	if (parent && parent.remoteUnits.length) {
		var ind = parent.remoteUnits.indexOf(unit);
		if (ind == -1) {
			return null;
		}
		if (ind == 0) {
			return FIRST_FLAG;
		}
		var remote = parent.remoteUnits[ind-1];
		if (remote.unitGroup) {
			remote = remote.unitGroup;
		}
		return document.getElementById('nodeDiv' + remote.id + 'at' + parent.id);
	}
	return null;
}

/** 
 * Returns true iff the unit 'unit' is displayed.
 */
function isNextDisplayed(unit) {
	if (unit.unitGroup == null) {
		if (unit.display) {
			return true;
		}
	}
	else if (unit.unitGroup.parts[0] == unit) {
		return true;
	}
	return false;
}

function arrow(right,e) {
    if (right_to_left) {// && (pointerUnit.isParagraph() || pointerUnit.isPassage())) {
        right = !right;
    }
    
	switch (dialog) {
	case 0:
		if (remoteAdd || refAdd) {
			if (remotePointerUnitIndex == -1) {
				unitSideways(right,true);
			}
		}
		else {
			if (e.shiftKey) {
				selectSideways(right);
			}
			else {
				if (!e.ctrlKey) {
					deselect();
				}
				moveSideways(right);
			}
			switchControl(true);
		}
		scrollToPointer();
		break;
	case 3:
		unitSideways(right,false);
		break;
	}
}
function union() {
    if (selectedUnits.length == 1) {
        var word = selectedUnits[0];
        var indexOfWord = word.parent.units.indexOf(word);
        var word_str = word.toString();
        var non_ascii_pattern = /(\\u[0-9A-F]{4})/g;
        var matches = word_str.match(non_ascii_pattern);
        word_str = word_str.replace(non_ascii_pattern, '|');
        
        var punctuation_pattern = /([^0-9A-Za-zÀ-ÿ])/g;
        var temp_new_words = new Array();
        var match;
        var last_index = 0;
        while (match = punctuation_pattern.exec(word_str)) {
            temp_new_words.push(word_str.substring(last_index, match.index));
            temp_new_words.push(word_str.substr(match.index, match[0].length));
            last_index = match.index + match[0].length;
        }
        temp_new_words.push(word_str.substring(last_index));
        
        var new_words = new Array();
        for (ind in temp_new_words) {
            if (temp_new_words[ind] == "") {
                continue;
            }
            else if (temp_new_words[ind] == "|") {
                new_words.push(matches.splice(0,1));
            }
            else {
                new_words.push(temp_new_words[ind]);
            }
        }

        if (new_words.length > 1) {
	    word.parent.units.splice(indexOfWord,1);
	    for (var ind=0; ind < new_words.length; ind++) {
                var new_unit = new Unit(word.parent,[new Atom(new_words[ind])]);
		word.parent.units.splice(indexOfWord+ind, 0, new_unit);
	    }
	    displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	    pointerLoc = indexOfWord;
	    if (control) {
		insertPointer();
	    }            
	}
    }
    else if (selectedUnits.length >= 2) {
        num_words = selectedUnits.length;
        selectedUnits.sort(comp_units);
        for (var ind = 0; ind < selectedUnits.length - 1; ind++) {
            child_ind = selectedUnits[ind].parent.units.indexOf(selectedUnits[ind]);
            if (selectedUnits[ind].parent.units[child_ind + 1].id != selectedUnits[ind+1].id) {
                console.log(selectedUnits[ind].parent.units[child_ind + 1]);
                console.log(selectedUnits[ind+1]);
                return;                
            }
        }
        
	indexOfWord = selectedUnits[0].parent.units.indexOf(selectedUnits[0]);
	new_word = '';
        for (var ind = 0; ind < selectedUnits.length; ind++) {
            new_word = new_word + selectedUnits[ind].toString();
        }
        var newUnit = new Unit(selectedUnits[0].parent, [new Atom(new_word)]);
	selectedUnits[0].parent.units.splice(indexOfWord,num_words,newUnit);
	
        deselect();
	displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	pointerLoc = calcPointerLoc(newUnit) + 1;
	if (control) {
	    insertPointer();
        }
    }
}

function comp_units(a,b) {
    return a.parent.units.indexOf(a) - b.parent.units.indexOf(b);
}
    /*
    if (selectedUnits.length == 1) {
	word = selectedUnits[0];
        return
	indexOfWord = word.parent.units.indexOf(word);
	inpWords = interleave_arrs(word.toString().match(/([0-9A-Za-zÀ-ÿ]+)/g), word.toString().match(/[^0-9A-Za-zÀ-ÿ]+/g));
	if (inpWords.length > 1) {
	    word.parent.units.splice(indexOfWord,1);
	    for (var ind=0; ind < inpWords.length; ind++) {
		if (inpWords[ind] == "") {
		    continue;
		}
		word.parent.units.splice(indexOfWord+ind, 0, new Unit(word.parent,[new Atom(inpWords[ind])]));
	    }
	    displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	    pointerLoc = indexOfWord;
	    if (control) {
		insertPointer();
	    }            
	}
        }
    */


function union_debug() {
    if (selectedUnits.length == 2) {
	var word = selectedUnits[0];
	var word2 = selectedUnits[1];
	if (word2.before(word)) {
	    var temp = word2;
	    word2 = word;
	    word = temp;
	}
	indexOfWord = word.parent.units.indexOf(word);
	if (word.parent.units[indexOfWord + 1] == word2) {
	    deselect();
	    var newUnit = new Unit(word.parent, [new Atom(word.toString() + word2.toString())]);
	    word.parent.units.splice(indexOfWord,2,newUnit);
	    displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	    pointerLoc = calcPointerLoc(newUnit) + 1;
	    if (control) {
		insertPointer();
	    }
	}
    }

    if (selectedUnits.length == 1) {
        var word = selectedUnits[0];
        var indexOfWord = word.parent.units.indexOf(word);
        var word_str = word.toString();
        new_words = word_str.split('')
        if (new_words.length > 1) {
	    word.parent.units.splice(indexOfWord,1);
	    for (var ind=0; ind < new_words.length; ind++) {
                var new_unit = new Unit(word.parent,[new Atom(new_words[ind])]);
		word.parent.units.splice(indexOfWord+ind, 0, new_unit);
	    }
	    displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	    pointerLoc = indexOfWord;
	    if (control) {
		insertPointer();
	    }            
	}
        
    }
    /*
    if (selectedUnits.length == 1) {
	word = selectedUnits[0];
        return
	indexOfWord = word.parent.units.indexOf(word);
	inpWords = interleave_arrs(word.toString().match(/([0-9A-Za-zÀ-ÿ]+)/g), word.toString().match(/[^0-9A-Za-zÀ-ÿ]+/g));
	if (inpWords.length > 1) {
	    word.parent.units.splice(indexOfWord,1);
	    for (var ind=0; ind < inpWords.length; ind++) {
		if (inpWords[ind] == "") {
		    continue;
		}
		word.parent.units.splice(indexOfWord+ind, 0, new Unit(word.parent,[new Atom(inpWords[ind])]));
	    }
	    displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	    pointerLoc = indexOfWord;
	    if (control) {
		insertPointer();
	    }            
	}
        }
    */
}


/**
 * If A and B are of the same size or A is longer by 1 than B, it returns an interleaving array.
 * For instance if A=[1,2,3], B=[10, 11] then it returns [1,10,2,11,3].
 */
function interleave_arrs(A,B) {
	if (A.length != B.length && A.length != B.length + 1) {
		return null;
	}
	var C = new Array();
	for (var ind=0; ind < A.length; ind++) {
		C.push(A[ind]);
		if (ind < B.length) {
			if (B[ind] == '\\' && ind+1 < A.length && /u[0-9]+/.test(A[ind+1].substring(0,5))) {
				C.push(B[ind] + A[ind+1].substring(0,5)); 
				A[ind+1] = A[ind+1].substring(5);
			}
			else {
				C.push(B[ind]);
			}
		}
	}
	return C;
}

/**
 * Groups the selected units into one unit
 * @returns the grouped unit if successful, null otherwise.
 */
function group() {
	if (selectedUnits.length == 0) {
		return null;
	}
	if  (selectedUnits.length == 1 && selectedUnits[0].type != 1) {
		if (UNITTYPE[selectedUnits[0].type].changable) {
			showBracket();
			markHidden(selectedUnits[0],false);
			return selectedUnits[0];
		}
		else {
			return null;
		}
	}
	//If entire super-unit is marked, don't allow to group.
	if (pointerUnit.length() == selectedUnits.length) {
		if (pointerUnit.parent.length() == 1) {
			return null;
		}
		/*
	      if (!pointerUnit.isParagraph()) {
	      return null;
	      }
		 */
	}
	if (pointerUnit.head != null) {
		var head = pointerUnit.head;
		if (head.isUnitGroup) {
			head = head.parts[0];
		}
		if (selectedUnits.indexOf(head) != -1) {
			if (selectedUnits.length == 1) {
				showBracket();
				markHidden(selectedUnits[0], false);
				return selectedUnits[0];
			}
			printUserMessage("Can't group units that include a unit's head unit.");
			return null;
		}
	}
	if (crossingLinkages(selectedUnits)) {
		printUserMessage("Can't group units that include some of the arguments of a linkage.");
		return null;
	}
	var curLinkages = relevantLinkages(selectedUnits);

	if (control){
		removePointer();
	}
	selectedUnits = sortArray(selectedUnits,pointerUnit.isUnitGroup);
	unit = selectedUnits[0];
	var unitPart = new Unit(unit.parent,null);
	var index = unit.parent.units.indexOf(unit);
	var remoteIndex = -1;
	if (unit.parent != null) {
		remoteIndex = unit.parent.remoteUnits.indexOf(unit);
	}
	unitPart.addChild(unit);
	var subsDiv;
	if (pointerUnit.isParagraph()) {
		subsDiv = document.getElementById("subsDiv0");	
	}
	else {
		subsDiv = document.getElementById("subsDiv" + pointerUnit.id);
	}
	var display = removeDivIfDisplayed(subsDiv,unit);
	var unitGroup = null;
	for (var i = 1; i < selectedUnits.length; i++) {
		unit = selectedUnits[i];
		display = (removeDivIfDisplayed(subsDiv,unit) || display);
		var sameSubunit = (unit.parent == selectedUnits[i-1].parent.parent);
		if (sameSubunit &&
				unit.parent.units[unit.parent.units.indexOf(unit) - 1]
		== selectedUnits[i-1]) {
			unitPart.addChild(unit);
		}
		else {  //if there is discontiguity
			if (unitGroup == null) {
				unitGroup = new UnitGroup(unit.parent);
			}
			unitGroup.addPart(unitPart);
			unitPart.parent.units.splice(index, unitPart.length(), unitPart);
			index = unit.parent.units.indexOf(unit);
			if (remoteIndex != -1) {
				unitPart.parent.remoteUnits.splice(remoteIndex, unitPart.length(), unitPart);
				remoteIndex = unit.parent.remoteUnits.indexOf(unit);
			}
			unitPart = new Unit(unit.parent,null);
			unitPart.addChild(unit);
			unit.toggleUnfinished();
			showUnit(unit);
		}

	}
	if (unitGroup != null) {
		unitGroup.addPart(unitPart);
		enqueueToLRU(unitGroup);
	}
	else { //if it is eventually contiguous
		unitPart.setType(48);
		enqueueToLRU(unitPart);
	}
	unitPart.parent.units.splice(index, unitPart.length(), unitPart);
	if (remoteIndex != -1) {
		unitPart.parent.remoteUnits.splice(remoteIndex, unitPart.length(), unitPart);
	}
	selectedUnits.splice(0, selectedUnits.length);
	displaySentence(pointerUnit, document.getElementById("sentSpan" + pointerUnit.id));
	if (unitGroup != null) {
		unitPart = unitGroup;
	}
	unitPart.setDisplayVal(true);
	pointerUnit.toggleUnfinished();
	expand(unitPart, pointerUnit);
	pointerLoc = calcPointerLoc(unitPart) + 1;
	if (control) {
		insertPointer();
	}
	showBracket();
	for (var j = 0; j < unitPart.units.length; j++) {
		markHidden(unitPart.units[j], false);
	}

	for (var k=0; k < curLinkages.length; k++) {
		displayLinkage(curLinkages[k]);
	}

	return unitPart;
}
function removeDivIfDisplayed(subsDiv,unit) {
	//remove all the divs of the linkages of the unit, if they are displayed
	for (var i=0; i < unit.linkages.length; i++) {
		var div = document.getElementById("link" + unit.linkages[i].id);
		if (div != null) {
			subsDiv.removeChild(div);
		}
	}

	if (unit.unitGroup == null && unit.display) {
		var div = document.getElementById("nodeDiv" + unit.id);
		if (div != null) {
			subsDiv.removeChild(div);
		}
		return true;
	}

	if (unit.unitGroup != null && unit.unitGroup.parts[0] == unit) {
		var div = document.getElementById("nodeDiv" + unit.unitGroup.id);
		if (div != null) {
			subsDiv.removeChild(div);
		}
		return true;
	}

	if (unit.type != 1) {
		return true;
	}

	return false;
}
function checkIfHead(unit) {
	if (unit.parent.unitGroup != null) {
		if (unit.parent.unitGroup.head == unit) {
			printUserMessage("Can't ungroup a unit while it is a unit's head.");
			return true;
		}
	}
	else if (unit.parent.head == unit) {
		printUserMessage("Can't ungroup a unit while it is a unit's head.");
		return true;
	}
	return false;
}
function ungroup(contiguous) {
	if (contiguous) {
		unit = selectedUnits[0];
	}
	else {
		unit = selectedUnits[0].unitGroup;
	}

	var curLinkages = relevantLinkages(unit.units);
	var indexAsChild = modifiedIndexOf(unit.parent, unit);

	if (contiguous) {
		while (unit.linkages.length > 0) {
			removeLinkage(unit.linkages[0]);
		}

		if (unit.display) {
			div = document.getElementById('nodeDiv' + unit.id);
			div.parentNode.removeChild(div);
		}
		if (unit.units.length && (unit.units[0] instanceof Atom)) {
			unit.setDisplayVal(false);
			unit.setType(1);
		}
		else {
			removeUnit(unit);
		}
	}
	else {
		unit = selectedUnits[0].unitGroup;

		while (unit.linkages.length > 0) {
			removeLinkage(unit.linkages[0]);
		}

		div = document.getElementById('nodeDiv' + unit.id);
		div.parentNode.removeChild(div);

		selectedUnits = sortArray(selectedUnits);
		for ( var i = 0; i < unit.parts.length; i++) {
			removeUnit(unit.parts[i]);
		}
	}
	showUnit(unit);
	while (unit.remoteUnits.length) {
		unit.removeRemoteUnit(unit.remoteUnits[0]);
	}
	while (unit.remoteOf.length) {
		div = document.getElementById('nodeDiv' + unit.id + 'at' + unit.remoteOf[0].id);
		div.parentNode.removeChild(div);
		var remoter = unit.remoteOf[0];
		remoter.removeRemoteUnit(unit);
		if (!remoter.hasChildrenToDisplay()) {
			hideSubtree(remoter);
		}
	}
	removeFromLRU(unit);
	if (pointerUnit.isParagraph() && !pointerUnit.parent.hasChildrenToDisplay()) {
		hideSubtree(pointerUnit.parent);		
	}
	else if (!pointerUnit.hasChildrenToDisplay()) {
		hideSubtree(pointerUnit);
	}
	pointerUnit.toggleUnfinished();
	deselect();
	displaySentence(pointerUnit, document.getElementById('sentSpan'+pointerUnit.id));
	pointerLoc = indexAsChild[0];
	if (control) {
		insertPointer();
	}

	//adds the linkages of the sub-units.
	for (var k=0; k < curLinkages.length; k++) {
		displayLinkage(curLinkages[k]);
	}
}
function hideSubtree(unit) {
	$('#minusImg' + unit.id).hide();
	$('#plusImg' + unit.id).hide();
	$('#subsentDiv' + unit.id).hide();
}
function checkAndUngroup() {
	if (selectedUnits.length == 0) {
		return;
	}
	var singleUnit = singleUnitSelected();
	if (singleUnit) {
		if (selectedUnits[0] instanceof Atom) {
			return;
		}
		if (selectedUnits[0].unitGroup != null || selectedUnits[0].units.length > 1) {
			ungroupIfNotRemoteUnit(singleUnit == 1);
		}
		else {
			if (selectedUnits[0].display) {
				ungroupIfNotRemoteUnit(true);
			}
		}
	}
}
function ungroupIfNotRemoteUnit(contiguous) {
	unit = contiguous ? selectedUnits[0] : selectedUnits[0].unitGroup;
	if (unit.remoteOf.length) {
		openDialog(2, "Unit is remote unit of " + unit.remoteOf.length +
				" units.  sure you want to ungroup?", ungroup,[contiguous]);
	}
	else {
		ungroup(contiguous);
	}
}
function removeUnit(unit) {
	var parent = unit.parent;
	var index = parent.units.indexOf(unit);
	parent.units = parent.units.slice(0,index).
	concat(unit.units,parent.units.slice(index+1));
//	wtf?
//	if (UNITTYPE[parent.type].code == "CLAUSE") {
//	parent.remoteUnits = parent.remoteUnits.slice(0,index).
//	concat(unit.units,parent.remoteUnits.slice(index+1));		
//	}
	for ( var j = unit.units.length - 1; j >= 0 ; j--) {
		unit.units[j].parent = parent;
		if (unit.units[j].unitGroup != null) {
			unit.units[j].unitGroup.parent = parent;
			if (unit.units[j].unitGroup.parts[0] == unit.units[j]) {
				expand(unit.units[j].unitGroup, parent);
			}
		}
		else if (unit.units[j].display) {
			expand(unit.units[j], parent);
		}
	}
}
/**
 * Change the pointer unit, fade the previous pointer unit.
 * @param unit the new pointer unit
 */
function changeFocus(unit, index) {
	$('.pointerUnitHighlight').removeClass('pointerUnitHighlight');
	if (arguments.length == 1) {
		if (remotePointerUnitIndex != -1) {
			$('#sentSpan' + pointerUnit.remoteUnits[remotePointerUnitIndex].id +
					'at' + pointerUnit.id).fadeTo(200, 0.4, null).removeClass('selected');
			$('#sentDiv' + pointerUnit.remoteUnits[remotePointerUnitIndex].id +
					'at' + pointerUnit.id).removeClass('focusUnit');
			remotePointerUnitIndex = -1;
		}
		else if (pointerUnit != null) {
			deselect();
			if (!pointerUnit.isParagraph()) {
				$('#sentSpan' + pointerUnit.id).fadeTo(200, 0.4, null);
			}
			$('#sentDiv' + pointerUnit.id).removeClass('focusUnit');
			if (pointerUnit.isParagraph() && remoteAdd == null && refAdd == null) {
				passageLoc = pointerLoc;
				passageUnit = pointerUnit;
			}
		}
		if (isHidden[unit.id]) {
			return;
		}
		if (unit.unitGroup != null) {
			unit = unit.unitGroup;
		}
		pointerUnit = unit;
		if (unit.isParagraph() && remoteAdd == null && refAdd == null) {
			pointerLoc = passageLoc;
		}
                else { 
                        pointerLoc = 0;
		}   
            
		$('#sentSpan' + unit.id).fadeTo(200, 1, null);
		$('#sentDiv' + unit.id).addClass('focusUnit');

		if (control && !dialog && remoteAdd == null && refAdd == null) {
			removePointer();
			insertPointer();
		}
	}
	else {
		deselect();
		if (remotePointerUnitIndex != -1) {
			$('#sentSpan' + unit.remoteUnits[remotePointerUnitIndex].id +
					'at' + unit.id).fadeTo(200, 0.4, null).removeClass('selected');
			$('#sentDiv' + unit.remoteUnits[remotePointerUnitIndex].id +
					'at' + unit.id).removeClass('focusUnit');
		}
		else {
			if (!pointerUnit.isParagraph()) {
				$('#sentSpan' + pointerUnit.id).fadeTo(200, 0.4, null);			
			}
			$('#sentDiv' + pointerUnit.id).removeClass('focusUnit');
		}
		pointerUnit = unit;
		$('#sentSpan' + pointerUnit.remoteUnits[index].id +
				'at' + pointerUnit.id).fadeTo(200, 1, null).addClass('selected');
		$('#sentDiv' + pointerUnit.remoteUnits[index].id +
				'at' + pointerUnit.id).addClass('focusUnit');
		remotePointerUnitIndex = index;
	}

	$(".unitSpan"+pointerUnit.id).addClass("pointerUnitHighlight");
}
/**
 * Jumps to a unit node in the tree
 * @param id the id of the unit to jump to. If no id is given, tries to jump to
 * selected unit's node
 */
function jump(id) {
	var success = true;
	if (arguments.length == 0) {
		if (selectedUnits.length == 0 && lruQueue.length > 0) {
			changeFocus(lruQueue[0]);
		}
		else {
			if (!jumpToSelected()) {
				success = false;
			}
		}
	}
	else {
		var unit = allUnits[id];
		if (unit.display || unit.isUnitGroup) {
			changeFocus(unit);
		}
		else {
			success = false;
		}
	}
	if (success) {
		removePointer();
		if (!allUnits[id].isParagraph() && !allUnits[id].isPassage()) {
			scrollToPointer();
		}
		insertPointer();
		if (remoteAdd || refAdd) {
			selectAfterSwitch();
		}
	}
}

function selectAfterSwitch() {
	if (pointerUnit.isUnitGroup) {
		toggleSelect(pointerUnit.parts[0].units[0]);
	}
	else {
		toggleSelect(pointerUnit.units[0]);
	}
	unitSideways(false, true);
}
function jumpToSelected() {
	switch (singleUnitSelected()) {
	case 1:
		if (selectedUnits[0].display) {
			changeFocus(selectedUnits[0]);
		}
		else {
			return false;
		}
		break;
	case -1:
		changeFocus(selectedUnits[0].unitGroup);
		break;
	}
	return true;
}
/**
 * Switch to next/previous sentence
 * @param true if switching to next sentence; false if switching to previous
 * sentence
 */
function remoteAddSwitchSent(next) {
	if (remoteAdd != null) {
		if (remotePointerUnitIndex >= 0) {
			var newIndex = remotePointerUnitIndex + (next ? 1 : -1);
			if (newIndex == pointerUnit.remoteUnits.length) {
				newIndex = -1;
				switchSent(true);
			}
			else if (newIndex == -1) {
				changeFocus(pointerUnit);
				selectAfterSwitch();
			}
			else {
				changeFocus(pointerUnit,newIndex);
			}
		}
		else if (pointerUnit == remoteAdd) {
			if (next && remoteAdd.remoteUnits.length) {
				changeFocus(pointerUnit,0);
			}
			else {
				switchSent(next);
			}
		}
		else {
			if (!next) {
				var unit = prevDisplayedUnit();
				if (unit == remoteAdd && remoteAdd.remoteUnits.length) {
					changeFocus(remoteAdd,remoteAdd.remoteUnits.length - 1);
				}
				else {
					switchSent(next);
				}
			}
			else {
				switchSent(next);
			}
		}
	}
	else {
		switchSent(next);
	}
	scrollToPointer();
}
function scrollToPointer() {
	var id = pointerUnit.id;
	if (pointerUnit.isParagraph()) {
		id = 0;
		if (remoteAdd != null || refAdd != null) {
			$("#sentDiv0").scrollTop($(".selected").position().top -
					Math.round($("#sentDiv0").height() * 0.5));
		}
		else {
		    var pointerContainer = $("#pointer");
		    if (pointerContainer == undefined) {
			return;
		    }
		    var mainScrollPos = Math.round(pointerContainer.offset().top + 
                                                   $("#sentDiv0").scrollTop() - Math.round($("#sentDiv0").height() * 1.1));
                    
		    if (lastScrollPos >= 0 && Math.abs(mainScrollPos - lastScrollPos) < 10) {
			mainScrollPos = lastScrollPos;
		    }
		    else {
			lastScrollPos = mainScrollPos;
		    }
                    
		    $("#sentDiv0").scrollTop(mainScrollPos);
		}
	}
	var newOffset = Math.round($("#sentDiv" + id).offset().top +
			$('#scroller').scrollTop() - Math.round($(window).height() * 2 / 3));
	if (lastScrollPosMain >= 0 && Math.abs(newOffset - lastScrollPosMain) < 10) {
		newOffset = lastScrollPosMain;
	}
	else {
		lastScrollPosMain = newOffset;
	}
	$('#scroller').scrollTop(newOffset);
}

function switchSent(next, curUnit) {
	if (arguments.length == 1) {
		curUnit = pointerUnit;
	}
	if (next) {
		unit = nextDisplayedUnit(curUnit);
	}
	else {
		unit = prevDisplayedUnit(curUnit);
	}
	if (unit != null) {
		changeFocus(unit);
		if (remoteAdd != null) {
			deselect();
			if (pointerUnit.isUnitGroup) {
				toggleSelect(pointerUnit.parts[0].units[0]);
			}
			else {
				toggleSelect(pointerUnit.units[0]);
			}
			if (!pointerUnit.isParagraph()) {
				unitSideways(false, true);
			}
		}
		else if (refAdd != null) {
			deselect();
			if (pointerUnit.isUnitGroup) {
				toggleSelect(pointerUnit.parts[0].units[0]);
			}
			else {
				toggleSelect(pointerUnit.units[0]);
			}
			if (!pointerUnit.isParagraph()) {
				unitSideways(false, true);
			}
		}
	}
}
/**
 * Finds the next displayed unit in the unit tree.
 * inpUnit is the current pointer unit.
 * @returns the next unit
 */
function nextDisplayedUnit(inpUnit) {
	if (arguments.length == 0) {
		inpUnit = pointerUnit;
	}
	var unit;
	if (inpUnit.isParagraph()) {
		unit = allUnits[0].units[0].units[0];
	}
	else if (inpUnit.isUnitGroup) {
		unit = inpUnit.parts[0].units[0];
	}
	else if (inpUnit.units[0] instanceof Atom) {
		unit = inpUnit;
	}
	else {
		unit = inpUnit.units[0];
	}
	while (unit != null && (!unit.display || isAncestorHidden(unit) ||
			(unit.parent.unitGroup == null && !isUnitNodeOpen[unit.parent.id] && !unit.parent.isParagraph()) ||
			(unit.parent.unitGroup != null && !isUnitNodeOpen[unit.parent.unitGroup.id] ))) {
		if (unit.unitGroup != null && unit.unitGroup.parts[0] == unit) {
			return unit.unitGroup;
		}
		nextUnit = sibling(unit, true);
		while (nextUnit == null) {
			if (unit.isPassage()) {
				return null;
			}
			unit = unit.parent;
			if (unit.unitGroup != null) {
				unit = unit.unitGroup.parts[0];
			}
			nextUnit = sibling(unit, true);
		}
		if (nextUnit.isParagraph()) {
			unit = nextUnit.units[0];
		}
		else {
			unit = nextUnit;
		}
	}
	return unit;
}
/**
 * Finds the previous displayed unit in the unit tree.
 * @returns the previous unit
 */
function prevDisplayedUnit(inpUnit) {
	if (arguments.length == 0) {
		inpUnit = pointerUnit;
	}
	if (inpUnit.isParagraph()) {
		return null;
	}
	var unit;
	if (inpUnit.isUnitGroup) {
		unit = inpUnit.parts[0];
	}
	else {
		unit = inpUnit;
	}
	var flag = true;
	while (flag) {
		var prevUnit = sibling(unit, false);
		if (prevUnit == null) {
			unit = unit.parent;
			if (unit.unitGroup != null) {
				return unit.unitGroup;
			}
			return unit;
		}
		else {
			unit = prevUnit;
			if (prevUnit.display && (parentUnitNodeOpen(prevUnit) ||
					prevUnit.parent.isParagraph()) && !isAncestorHidden(prevUnit)) {
				flag = false;
			}
			else if (prevUnit.unitGroup != null && prevUnit.unitGroup.parts[0] == prevUnit) {
				unit = unit.unitGroup;
				flag = false;
			}
		}
	}

	while (!flag) {
		flag = true;
		if (unit.isUnitGroup) {
			prevUnit = unit.parts[unit.parts.length - 1];
			prevUnit = prevUnit.units[prevUnit.units.length - 1];
		}
		else {
			prevUnit = unit.units[unit.units.length - 1];
		}
		while (prevUnit != null && flag) {
			if (prevUnit.display && (parentUnitNodeOpen(prevUnit) ||
					prevUnit.parent.isParagraph()) && !isAncestorHidden(prevUnit)) {
				unit = prevUnit;
				flag = false;
			}
			else if (prevUnit.unitGroup != null && !isAncestorHidden(prevUnit.unitGroup) &&
					prevUnit.unitGroup.parts[0] == prevUnit) {
				unit = prevUnit.unitGroup;
				flag = false;
			}
			prevUnit = sibling(prevUnit, false);

		}
	}
	if (unit == null) {
		return passageUnit;
	}
	return unit;
}

/**
 * Returns true if the parent of the unit node is open
 */
function parentUnitNodeOpen(unit) {
	if (unit == null || unit.parent == null) {
		return false;
	}
	if (unit.isParagraph()) {
		return true;
	}
	if (unit.parent.unitGroup != null) {
		return isUnitNodeOpen[unit.parent.unitGroup.id];
	}
	return isUnitNodeOpen[unit.parent.id];
}

/**
 * Given a unit, return its next or previous sibling in its parent's subunit array
 * @param unit the given unit
 * @param next true if next sibling, false if previous sibling
 * @returns next or previous sibling
 */
function sibling(unit, next) {
	parent = unit.parent;
	if (parent == null) {
		return null;
	}
	if (parent.unitGroup == null) {
		index = parent.units.indexOf(unit) + ((next) ? 1 : (-1));
		if (index < 0) {
			if (parent && parent.isParagraph()) {
				var prevPar = sibling(parent,false);
				if (prevPar != null) {
					return prevPar.units[prevPar.units.length - 1];
				}
			}
			return null;
		}
		else if (index == parent.units.length) {
			if (parent && parent.isParagraph()) {
				var prevPar = sibling(parent,true);
				if (prevPar != null) {
					return prevPar.units[0];
				}
			}
			return null;
		}
		else {
			return parent.units[index];
		}
	}
	var g = parent.unitGroup;
	var indices = findIndices(unit);
	if (next) {
		if (indices[1] + 1 == g.parts[indices[0]].units.length) {
			if (indices[0] == g.parts.length - 1) {
				return null;
			}
			else {
				return g.parts[indices[0] + 1].units[0];
			}
		}
		else {
			return g.parts[indices[0]].units[indices[1] + 1];
		}
	}
	else {
		if (indices[1] == 0) {
			if (indices[0] == 0) {
				return null;
			}
			else {
				return g.parts[indices[0] - 1].units[g.parts[indices[0] - 1].units.length - 1];
			}
		}
		else {
			return g.parts[indices[0]].units[indices[1]-1];
		}
	}
}
/**
 * Toggles the selection of a given unit 
 * @param unit a given unit to be selected/deselected
 */
function toggleSelect(unit, select, temp, pointer) {
	var type;
	var arr;
	if (unit.isUnitGroup) {
		unit = unit.parts[0];
	}

	if (arguments.length == 1) {
		if (unit.unitGroup != null) {
			if (unit.unitGroup.id in selectedNCURepresentatives &&
					selectedNCURepresentatives[unit.unitGroup.id] != -1) {
				if (selectedNCURepresentatives[unit.unitGroup.id] == unit.id) {
					select = false;
					selectedNCURepresentatives[unit.unitGroup.id] = -1;
				}
				else {
					return;
				}
			}
			else{
				selectedNCURepresentatives[unit.unitGroup.id] = unit.id;
				select = true;
			}
		}
		else {
			select = !isSelected(unit);
		}
	}
	else if (isSelected(unit) && select) {
		return;
	}

	if (arguments.length < 3 || temp == false) {
		type = "selected"; //default type
		arr = selectedUnits;
	}
	else {
		type = select?"tempselected":"tempdeselected";
		arr = tempSelectedUnits;
	}
	if (select || temp) {
		if (unit.unitGroup != null) {
			unit = unit.unitGroup;
			for ( var n = 0; n < unit.parts.length; n++) {
				arr.push(unit.parts[n]);
			}
		}
		else {
			arr.push(unit);
		}
		if (arguments.length < 4 || !pointer) {
			$(".unitSpan" + unit.id).addClass(type);
		}
		else {
			$("#sentSpan" + unit.id).addClass(type);
		}
	}
	else if (unit.unitGroup != null) {
		for ( var i = arr.length - 1; i >= 0 ; i--) {
			if (arr[i].unitGroup == unit.unitGroup) {
				arr.splice(i,1);
			}
		}
		$(".unitSpan" + unit.unitGroup.id).removeClass(type);
		$("#sentSpan" + unit.unitGroup.id).removeClass(type);
	}
	else {
		for ( var i = arr.length - 1; i >= 0 ; i--) {
			if (arr[i] == unit) {
				arr.splice(i,1);			
			}
		}
		$(".unitSpan" + unit.id).removeClass(type);
		$("#sentSpan" + unit.id).removeClass(type);
	}
}
/*
 * Toggles the LRU unit in the index indexInLRU as selected.
 * selectYN = true if we want the unit selected, N otherwise. If not specified it toggles them.
 */
function toggleLRUSelect(indexInLRU, selectYN) {
	if (indexInLRU >= lruQueue.length) {
		return;
	}
	var unit = lruQueue[indexInLRU];
	if (arguments.length == 1) {
		$(".unitSpan" + unit.id).filter(".LRU").toggleClass("lruSelected");
	}
	else {
		if (selectYN) {
			$(".unitSpan" + unit.id).filter(".LRU").addClass("lruSelected");
		}
		else {
			$(".unitSpan" + unit.id).filter(".LRU").removeClass("lruSelected");
		}
	}
}
/**
 * switches to the next/preceding sentence.
 * downDir = true if the direction is down, false otherwise.
 */
function switchLRUSent(downDir) {
	if ((downDir && lruCursorIndex == lruQueue.length-1) ||
			(!downDir && lruCursorIndex == 0)) {
		return;
	}
	toggleLRUSelect(lruCursorIndex);
	if (downDir) {
		lruCursorIndex++;
	}
	else {
		lruCursorIndex--;
	}
	toggleLRUSelect(lruCursorIndex);
	lruScrollToPointer();
}
/**
 * Select the unit to the right or to the left of the pointer and move the pointer.
 * @param right whether the pointer should go right or left
 */
function selectSideways(right) {
	if (right && pointerLoc < pointerUnit.length()) {
		moveSideways(right);
		if (!pointerUnit.isUnitGroup) {
			toggleSelect(pointerUnit.units[pointerLoc - 1]);
		}
		else {
			var end = 0;
			var start = 0;
			var i = 0;
			while (end < pointerLoc) {
				start = end;
				end += pointerUnit.parts[i++].units.length + 1;
			}
			if (end != pointerLoc) {
				toggleSelect(pointerUnit.parts[--i].units[pointerLoc - start - 1]);
			}
		}
	}
	else if (!right && pointerLoc > 0) {
		moveSideways(right);
		if (!pointerUnit.isUnitGroup) {
			toggleSelect(pointerUnit.units[pointerLoc]);
		}
		else {
			var end = 0;
			var start = 0;
			var i = 0;
			while (end <= pointerLoc) {
				start = end;
				end += pointerUnit.parts[i++].units.length + 1;
			}
			if (end != pointerLoc + 1) {
				toggleSelect(pointerUnit.parts[--i].units[pointerLoc - start]);
			}

		}
	}
}
/**
 * Moves the pointer right/left, one unit at a time 
 * @param right whether the pointer should go right or left
 */
function moveSideways(right) {
	pointerLoc = (pointerUnit.length() + 1 + pointerLoc
			+ (right ? 1 : -1)) % (pointerUnit.length() + 1);
	if (pointerUnit.isParagraph()) {
		if (right && !pointerLoc) {
			var index = (pointerUnit.parent.units.indexOf(pointerUnit) + 1) % pointerUnit.parent.units.length;
			changeFocus(pointerUnit.parent.units[index]);
		}
		else if (!right && (pointerLoc == pointerUnit.length())) {
			var index = (pointerUnit.parent.units.indexOf(pointerUnit) + pointerUnit.parent.units.length - 1) % pointerUnit.parent.units.length;
			changeFocus(pointerUnit.parent.units[index]);
			pointerLoc = pointerUnit.length();
		}
	}
}
/**
 * Used for debugging only!
 * @param errMsg the message to be displayed
 */
function errorPrinter(errMsg) {
	var err = document.getElementById('err');
	err.innerHTML += errMsg;
}
function xmlPrinter(xmlStr) {
	var forXml = document.getElementById('forXML');
	forXml.appendChild(document.createTextNode(xmlStr));
	$("#bodyDiv").hide();
	$("#forXML").show();
}
/**
 * Cancels selection of any word
 */
function deselect(onlyTemps) {
	if (!tempSelectedUnits.length && (arguments.length < 1 || !onlyTemps)) {
		while (selectedUnits.length != 0) {
			var i = selectedUnits.pop();
			if (i.unitGroup != null) {
				$(".unitSpan" + i.unitGroup.id).removeClass("selected");
				$("#sentSpan" + i.unitGroup.id).removeClass("selected");
			}
			else {
				$(".unitSpan" + i.id).removeClass("selected");
				$("#sentSpan" + i.id).removeClass("selected");
			}
		}
	}
	tempSelectedUnits = [];
	$(".tempselected").removeClass("tempselected");
	$(".tempdeselected").removeClass("tempdeselected");
}
function selectTemp() {
	while (tempSelectedUnits.length != 0) {
		var i = tempSelectedUnits.pop();
		if (selecting) {
			$(".unitSpan" + i.id).removeClass("tempselected");
			if (!isSelected(i)) {
				$(".unitSpan" + i.id).addClass("selected");
				selectedUnits.push(i);
			}
		}
		else {
			$(".unitSpan" + i.id).removeClass("tempdeselected");
			if (!isSelected(i)) {
				$(".unitSpan" + i.id).removeClass("selected");
				selectedUnits.splice(selectedUnits.indexOf(i),1);
			}

		}

	}
}
/**
 * Selects all units between two given units
 * @param unit1 the first unit ("anchor unit")
 * @param unit2 the last unit ("focus unit")
 * @returns {Boolean} true if successful, false otherwise
 */
function selectBetween(unit1,unit2,select, temp) {
	if (arguments.length < 4) {
		temp = false;
	}
	deselect(true);
	var parent = unit1.parent;
	if ((parent.unitGroup == null && parent != unit2.parent) ||
			parent.unitGroup != null && parent.unitGroup != unit2.parent.unitGroup) {
		return false;
	}
	if (arguments.length < 3) {
		select = true;
	}
	if (parent.unitGroup != null) {
		var indices1 = findIndices(unit1);
		var indices2 = findIndices(unit2);
		if (indices1[0] > indices2[0] ||
				(indices1[0] == indices2[0] && indices1[1] > indices2[1])) {
			var temp1=indices1;
			indices1=indices2;
			indices2=temp1;
		}
		while (indices1[0] < indices2[0] ||
				(indices1[0] == indices2[0] && indices1[1] <= indices2[1])) {
			var unit = parent.unitGroup.parts[indices1[0]].units[indices1[1]];
			toggleSelect(unit, select, temp);
			if (++indices1[1] >= parent.unitGroup.parts[indices1[0]].units.length) {
				indices1[1] = 0;
				indices1[0]++;
			}
		}
	}
	else {
		index1 = modifiedIndexOf(parent, unit1)[0];
		index2 = modifiedIndexOf(parent, unit2)[0];
		//switch between indices
		if (index1 > index2) {
			var temp1=index1;
			index1=index2;
			index2=temp1;
		}
		for ( var i = index1; i <= index2; i++) {
			toggleSelect(parent.units[i], select, temp);
		}
	}
	return true;
}

/**
 * toggles the display of subunits of a given unit.
 * @param id
 */
function toggleSubsent(id) {
	isUnitNodeOpen[id] = !isUnitNodeOpen[id]; 
	if (!isUnitNodeOpen[id]) {
		var unit = pointerUnit.parent;
		var collapsedUnit = allUnits[id];
		var flag = true;
		while (unit != null && flag) {
			if (unit == collapsedUnit) {
				flag = false;
				changeFocus(unit);
			}
			unit = unit.parent;
		}
	}
	$("#subsentDiv" + id).toggle("slow");
	$("#plusImg" + id).toggle();
	$("#minusImg" + id).toggle();
}
function mouseover(id,e,highlight,index) {
	if (!e.which && e.button) {
		if (e.button & 1) e.which = 1;      // Left
		else if (e.button & 4) e.which = 2; // Middle
		else if (e.button & 2) e.which = 3; // Right
	}
	if (e.which == 1 && !dialog) {
		var unit = allUnits[id];
		if (unit.isUnitGroup) {
			if (arguments.length == 4) { //just making sure
				unit = unit.parts[index];
			}
			else {
				return;
			}
		}
		if (tempSelectedUnits.length && anchorUnit != null) {
			deselect();
			if (remoteAdd == null && refAdd == null) {
				selectBetween(anchorUnit, unit, !isSelected(anchorUnit), true);
				return;
			}
		}
		//	if (!highlight) { || anchorUnit == null) {
		else {
			unit = unit.parent;
			while (unit != null) {
				if (unit.unitGroup != null) {
					unit = unit.unitGroup;
				}
				if (highlight) {
					$('.unitSpan' + unit.id).addClass('highlighted');
				}
				else {
					$('.unitSpan' + unit.id).removeClass('highlighted');
				}
				unit = unit.parent;
			}
		}
		//}
	}
}
/**
 * Adds display rules to the document's stylesheet, according to the
 * UNITTYPE array.
 */
function addToCss() {
	var sheet = document.styleSheets[0];
	for (n in UNITTYPE) {

		if (sheet.insertRule) { // firefox
			sheet.insertRule("." + UNITTYPE[n].code +"bg { background-color: "
					+ UNITTYPE[n].bgColor+" }", document.styleSheets.length);
			sheet.insertRule(".UNIT." + UNITTYPE[n].code +"border, .LRU." + UNITTYPE[n].code +"border { border-color: " +
					UNITTYPE[n].borderColor+" }", document.styleSheets.length);
		}
		else if(sheet.addRule) { // ie
			sheet.addRule("." + UNITTYPE[n].code +"bg", "background-color: "
					+ UNITTYPE[n].bgColor);
			sheet.addRule(".UNIT." + UNITTYPE[n].code +"border, .LRU." + UNITTYPE[n].code +"border", "border-color:" +
					UNITTYPE[n].borderColor);
		}
	}

	if (jQuery.browser.mozilla) { //mozilla should have higher line heights.
		sheet.insertRule(".small-display-size { font-size: 0.8em; line-height: 1.7em;}", document.styleSheets.length);
		sheet.insertRule(".medium-display-size { font-size: 0.9em; line-height: 1.7em;}", document.styleSheets.length);
		sheet.insertRule(".large-display-size { font-size: 1em; line-height: 1.8em;}", document.styleSheets.length);

		/*
        sheet.insertRule("span#pointer.small-display-size { font-size: 0.8em;}", document.styleSheets.length);
        sheet.insertRule("span#pointer.medium-display-size { font-size: 0.9em;}", document.styleSheets.length);
        sheet.insertRule("span#pointer.large-display-size { font-size: 1em;}", document.styleSheets.length);
		 */
	}
	else {
		sheet.insertRule(".small-display-size { font-size: 0.8em; line-height: 1.6em;}", document.styleSheets.length);
		sheet.insertRule(".medium-display-size { font-size: 0.9em; line-height: 1.7em;}", document.styleSheets.length);
		sheet.insertRule(".large-display-size { font-size: 1em; line-height: 1.8em;}", document.styleSheets.length);
	}

}

/**
 * Remove unnecessary buttons in annotation review mode
 */
function annotationReviewButtons() {
	$('#reset_button').remove();
	$('#unfit_button').remove();
}

/**
 * Adds type-marking buttons to the window according to the UNITTYPE array
 */
function addMarkingButtons() {
	if (mode != "basic") {
		return;
	}
	var div = document.getElementById('markingButtons');
	while (div.hasChildNodes()) {
		div.removeChild(div.lastChild);
	}
	for (i in UNITTYPE) {
		if (UNITTYPE[i].display) {
		    var circle = document.createElement('a');
		    circle.setAttribute('class', UNITTYPE[i].code + "bg category-button");

		    var auxButtons = document.createElement('div');
		    auxButtons.setAttribute('class', 'catButtonIcon');
		    auxButtons.setAttribute('style', 'display: inline; position: absolute; right: 2em; z-index: 200; opacity: 0;');

		    var helpIcon = document.createElement('a');
		    helpIcon.setAttribute('style', 'margin-left: 0.3em; border: 1px solid black; padding-right: 1px; padding-left: 1px;');
		    helpIcon.setAttribute('title', 'help for this button');

		    helpIcon.innerHTML = "?";
		    helpIcon.setAttribute('onclick', "helpIcon(event, '"+UNITTYPE[i].code+"');");

		    if (UNITTYPE[i].code != "FUNCTION") {
			var remoteIcon = document.createElement('a');
			remoteIcon.innerHTML = "R";
			remoteIcon.setAttribute('onclick', "remoteIcon(event, '"+i+"');");
			remoteIcon.setAttribute('title', "add a remote "+UNITTYPE[i].name);
			remoteIcon.setAttribute('style', "border: 1px solid black; padding-right: 1px; padding-left: 1px;");
			auxButtons.appendChild(remoteIcon);
		    }

		    auxButtons.appendChild(helpIcon);                    
		    var extButton = document.createElement('a');
		    extButton.appendChild(circle);
		    extButton.innerHTML = extButton.innerHTML + UNITTYPE[i].caption;
		    extButton.appendChild(auxButtons);
		    extButton.setAttribute('class', 'var-button button '+active_button_size);
                    if (UNITTYPE[i].space) { //adds bottom space
                        extButton.setAttribute('style', 'margin-bottom: 0.7em');
                    }
		    extButton.setAttribute('onclick', 'checkAndSetUnitType(' + i + ')');
		    extButton.setAttribute('title', UNITTYPE[i].key+" : "+UNITTYPE[i].title);

		    div.appendChild(extButton);
		}
	}
}

/**
 * Adds other buttons to the window according to the mode
 */
function addOtherButtons() {
    var buttonCode="";
    if (mode == "basic") {
        
	buttonCode+=
	"<a class='button constant-button' id='space_button' onclick='spacebar()'>"+
	    "(Un)group"+
	    "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px;' onclick='helpIcon(event, \"GROUP\");' title='help for this button'>?</div>"+
	    "</a>"+
	    "<a class='button constant-button' id='add_link_button' onclick='createOrRemoveLinkage(selectedUnits);'>"+
	    "Link"+
	    "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px;' onclick='helpIcon(event, \"LINK\");' title='help for this button'>?</div>"+
	    "</a>"+
	    /*"<a class='button constant-button' id='add_ref_button' onclick='checkAndEnterRefMode();'>"+
	      "Reference"+
	      "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px;' onclick='helpIcon(event, \"REFERENCE\");' title='help for this button'>?</div>"+
	      "</a>"+*/
	"<a class='button constant-button' id='implicit_button' onclick='if (remoteAdd) addImplicitUnit();'>"+
	    "Implicit"+
	    "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px;' onclick='helpIcon(event, \"IMPLICIT\");' title='help for this button'>?</div>"+
	    "</a>"+
	    "<a class='button constant-button' id='finish_button' onclick='finishAll();'>"+
	    "Finish All"+
	    "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px;' onclick='helpIcon(event, \"FINISH\");' title='help for this button'>?</div>"+
	    "</a>"+
	    "<a class='button constant-button' id='uncertain_button' onclick='setUncertainAnnotation();'>"+
	    "Uncertain"+
	    "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px; ' onclick='helpIcon(event, \"UNCERTAIN\");' title='help for this button'>?</div>"+
	    "</a>"+
	    "<a class='button constant-button' id='unanalyzable_button' onclick='setUnanalyzable();'>"+
	    "Unanalyzable"+
	    "<div class='catButtonIcon' style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px; ' onclick='helpIcon(event, \"UNANALYZABLE\");' title='help for this button'>?</div>"+
	    "</a>";
    }
    if (mode == "review" || rtid != -1) {
	buttonCode+=
	"<a class='button constant-button' id='combine_button' onclick='union();'>"+
	    "Combine"+
	    "<div class='catButtonIcon'  style='display: inline; position: absolute; right: 2em; z-index: 200; border: 1px solid black; padding-right: 1px; padding-left: 1px; ' onclick='helpIcon(event, \"COMBINE\");' title='help for this button'>?</div>"+
	    "</a>";
	//$("#save_button").hide();
    }		

    TITLES["submit_button"] ="Alt+b: Submit"+((mode=="review") ? "" : " (unit will be considered completed)");
    $('#otherButtons').html(buttonCode);
    addButtonTitles();
}

/***********************************************
 * Disable Text Selection script- ֲ© Dynamic Drive DHTML code library (www.dynamicdrive.com)
 * This notice MUST stay intact for legal use
 * Visit Dynamic Drive at http://www.dynamicdrive.com/ for full source code
 ***********************************************/

function disableSelection(target){
	if (typeof target.onselectstart != "undefined") {//IE route
		target.onselectstart = function() {return false;};
	}
	else if (typeof target.style.MozUserSelect != "undefined") {//Firefox route
		target.style.MozUserSelect = "none";
	}
	else {//All other route (ie: Opera)
		target.onmousedown = function() {return false;};
	}
	target.style.cursor = "default";
}

//Sample usages
//disableSelection(document.body) //Disable text selection on entire body
//disableSelection(document.getElementById("mydiv")) //Disable text selection on element with id="mydiv"
function isSelected(unit) {
	for (var k = 0; k < selectedUnits.length; k++) {
		if (selectedUnits[k] == unit) {
			return true;
		}
	}
	return false;
}
function switchControl(keyboard) {
	if (!keyboard) { //switch to mouse
		if (control) {
			control = false;
			removePointer();
		}

	}
	else {
		if (control) {
			removePointer();
		}
		control = true;
		if (remoteAdd == null && refAdd == null) {
			insertPointer();
		}
	}
}
function calcPointerLoc(unit) {
	if (unit.isUnitGroup) {
		unit = unit.parts[unit.parts.length - 1];
	}
	if (unit.parent.unitGroup != null) {
		var indices = findIndices(unit);
		var res = 0;
		for (var i = 0; i < indices[0]; i++) {
			res += unit.parent.unitGroup.parts[i].units.length;
		}
		res += indices[0]; //ellipses
		res += indices[1][0];
		return res;
	}
	else {
		return unit.parent.units.indexOf(unit);
	}
}
/**
 * Select the previous/next unit when in single unit choosing mode
 * @param right whether the pointer should go right or left
 */
function unitSideways(right,allowPointerUnit) {
	moveSideways(right);
	while (selectedUnits.length) {
		toggleSelect(selectedUnits[0],false);
	}
	if (!pointerUnit.isUnitGroup) {
		if (pointerUnit.length() == pointerLoc) {
			if (arguments.length > 1 && allowPointerUnit && !pointerUnit.isParagraph()) {
				toggleSelect(pointerUnit,true,false,true);
			}
			else {
				moveSideways(right);
				toggleSelect(pointerUnit.units[pointerLoc],true);
			}
		}
		else {
			toggleSelect(pointerUnit.units[pointerLoc],true);
		}
	}
	else {
		var end = 0;
		var start = 0;
		var i = 0;
		while (end <= pointerLoc) {
			start = end;
			end += pointerUnit.parts[i++].units.length + 1;
		}
		if (end != pointerLoc + 1) {
			toggleSelect(pointerUnit.parts[--i].units[pointerLoc - start],true);
		}
		else {
			if (i == pointerUnit.parts.length && arguments.length > 1 && allowPointerUnit) {
				toggleSelect(pointerUnit,true,false,true);				
			}
			else {
				moveSideways(right);
				if (right) {
					if (pointerLoc == 0) {
						toggleSelect(pointerUnit.parts[0].units[0],true);
					}
					else {
						toggleSelect(pointerUnit.parts[i].units[pointerLoc - end],true);
					}
				}
				else {
					toggleSelect(pointerUnit.parts[--i].units[pointerLoc - start],true);
				}
			}
		}
	}
}
function spacebar() {
	if (dialog == 3) {
		headDialogAccept();
		return;
	}
	else if (dialog != 0) {
		return;
	}
	if (remoteAdd != null) {
		if (cursorInLRU) {
			checkAndAddRemote(lruQueue[lruCursorIndex].id);
			toggleLRUSelectMode(false);
		}
		else {
			checkAndAddRemote();
		}
	}
	else if (refAdd != null) {
		if (cursorInLRU) {
			checkAndAddReferent(lruQueue[lruCursorIndex].id);
			toggleLRUSelectMode(false);
		}
		else {
			checkAndAddReferent();
		}
	}
	else if (cursorInLRU) {
		toggleLRUSelectMode(false);
		jump(lruQueue[lruCursorIndex].id);
		edit(lruQueue[lruCursorIndex].id);
	}
	else if (selectedUnits.length != 0) {
		selectedUnits = sortArray(selectedUnits);
		selectedUnits = sortArray(selectedUnits);
		if (selectedUnits[0].parent.unanalyzable) {
			printUserMessage("Cannot group - Unit unanalyzable.");
			return;
		}

		var singleUnit = singleUnitSelected();
		if (singleUnit) {
			if (selectedUnits[0] instanceof Atom) {
				return;
			}
			if (selectedUnits[0].unitGroup != null || selectedUnits[0].units.length > 1) {
				ungroupIfNotRemoteUnit((singleUnit == 1));
			}
			else {
				if (!selectedUnits[0].display) {
					group();
				}
				else {
					ungroupIfNotRemoteUnit(true);
				}
			}
		}
		else {
			switchControl(true);
			group();
		}
	}
}
/** 
 * Edits a unit. If it is hidden, unhide it. If it has a sub-tree, expand it.
 * Refers to a selected unit if there is one.
 */
function edit(unit) {
	if (arguments.length == 0) {
		if (selectedUnits.length == 0) {
			if (!pointerUnit.isPassage() && !pointerUnit.isParagraph()) {
				unit = pointerUnit;
			}
			else {
				return;
			}
		}
		else if (singleUnitSelected() == -1) {
			unit = selectedUnits[0].unitGroup;
		}
		else {
			unit = selectedUnits[0];
		}
	}
	var ancestor = unit;
	while (ancestor.parent != null) {
		showUnit(ancestor);
		toggleCollapse(false, ancestor);
		ancestor = ancestor.parent;
	}
}
/**
 * Returns true if all the sons of the main clause are hidden.
 */
function allHidden() {
	var parags = allUnits[0].units;
	for (var i=0; i < parags.length; i++) {
		for (var j=0; j < parags[i].units.length; j++) {
			var curUnit = parags[i].units[j];
			if ((curUnit.unitGroup || curUnit.display) && !isHidden[curUnit.id]) {
				return false;
			}
		}
	}
	return true;
}

/**
 * hides a certain unit. fast if the toggling should be fast.
 */
function hideUnit(unit, fast) {
	if (arguments.length == 1) {
		fast = false;
	}
	if (!fast) {
		$("#nodeDiv" + unit.id).hide("slow");
	}
	else {
		$("#nodeDiv" + unit.id).hide();        
	}

	markHidden(unit, true);
	/*
    for (var i=0; i < unit.linkages.length; i++) {
        if (!fast) {
	    $("#linkDiv" + unit.linkages[i].id).hide("slow");        
        }
        else {
	    $("#linkDiv" + unit.linkages[i].id).hide();        
        }
	unit.linkages[i].isHidden = true;
    }
	 */
	if (allHidden()) {
		hideBracket();
	}
}

/**
 * Show unit again (the contrary of hide).
 */
function showUnit(unit) {
	if (isHidden[unit.id]) {
		$("#nodeDiv" + unit.id).toggle("slow");
		markHidden(unit, false);
		showBracket();
		/*
		for (var i=0; i < unit.linkages.length; i++) {
			if (unit.linkages[i].allComponentsVisible()) {
				$("#linkDiv" + unit.linkages[i].id).show("slow");
				unit.linkages[i].isHidden = false;
			}
		}
		 */
	}
}

/**
 * Marks all descendents of units to have a "hidden" value = val.
 */
function markHidden(unit, val) {
	isHidden[unit.id] = val;
}
function isAncestorHidden(unit) {
	if (unit.isPassage() || unit.isParagraph()) {
		return false;
	}
	if (isHidden[unit.id]) {
		return true;
	}
	if (unit.unitGroup != null && isHidden[unit.unitGroup.id]) {
		return true;
	}
	return isAncestorHidden(unit.parent);
}
/**
 * Prints a message in the messages for users.
 */
function printUserMessage(str) {
	openDialog(9, str);
	//var msg = document.getElementById('LogDivMsg');
	//msg.innerHTML = str;
}

/**
 * sets the current unit as unanalyzable if it was analyzable and the other way.
 */
function setUnanalyzable() {
	var unit = pointerUnit;

	if (unit.isParagraph() || unit.isPassage()) {
		return;
	}

	if (!unit.unanalyzable) {
		// Check if any of the children are of type different from the default types
		for (var index=0; index < unit.units.length; index++) {
			if (unit.units[index].length() > 1 || unit.units[index].display)  {
				printUserMessage("Cannot set as unanalyzable - Has non-trivial children.");
				return;
			}
		}
		for (var index=0; index < unit.units.length; index++) {
			if (unit.units[index].type != 1 && unit.units[index].type != 2 && unit.units[index].type != 0) {
				unit.units[index].setType(48);
			}
		}

		$("#sentDiv"+unit.id).addClass("unanalyzable");
		unit.behead();
		removeAllRemoteUnits(unit);
		unit.setUnanalyzableVal(true);
	}
	else {
		unit.setUnanalyzableVal(false);
		$("#sentDiv"+unit.id).removeClass("unanalyzable");
	}
}

/**
 * Sets the current unit as hard to annotate.
 */
function setUncertainAnnotation() {
	var pUnit = pointerUnit;

	if (pUnit.isParagraph() || pUnit.isPassage()) {
		return;
	}
	$("#sentDiv"+pUnit.id).toggleClass("uncertain");
	pUnit.toggleUncertainAnnotation();
}
/**
 * Removes the divs of the linked units by this link.
 */
function removeLinkageDivs(link) {
	$('#subsDiv'+link.linker.id).children().filter('.link').remove();
	if (link.linker.hasChildrenToDisplay()) {
		hideSubtree(link.linker);
	}
}
function showTopButtons() {
	if (!topButtonsShown) {
		$("#topButtons").fadeIn("fast");
		topButtonsShown = true;
	}
}
function hideTopButtons() {
	if (topButtonsShown) {
		$("#topButtons").fadeOut("fast");
		topButtonsShown = false;
	}
}
function addButtonTitles() {
	for (key in TITLES) {
		$("#"+key).attr("title", TITLES[key]);
	}
}
function toggleAnimation() {
	$("#animationDiv").fadeTo("fast", 0);
}
function animationOn() {
	if (noAnimationFlag) {
		return;
	}
	$("#animationDiv").show();
}

function helpIcon(event, helpCode) {
	//stopping the event from propogating
	if (typeof event.stopPropagation != 'undefined') {
		event.stopPropagation();
	}
	if (typeof event.cancelBubble != 'undefined') {
		event.cancelBubble = true;
	}
	openDocsDialog(helpCode);
}

function remoteIcon(event, keynum) {
	if (typeof event.stopPropagation != 'undefined') {
		event.stopPropagation();
	}
	if (typeof event.cancelBubble != 'undefined') {
		event.cancelBubble = true;
	}
	checkAndChooseRemoteUnits(keynum);
}

/**
 * Move the help scrollbar down or up.
 */
function scrollHelpDialog(up, pageshift) {
	var multiplier = 1;
	if (pageshift) {
		multiplier = 10;
	}
	if (up) {
		$('#dialog').scrollTop($("#dialog").scrollTop() - Math.round($("#dialog").height() * 0.2)*multiplier);
	}
	else {
		$('#dialog').scrollTop($("#dialog").scrollTop() + Math.round($("#dialog").height() * 0.2)*multiplier);
	}
}

/* The titles for the different buttons.*/
var TITLES = {
    "space_button": "Space bar: If one unit is selected, it ungroups it; If two or more, it groups them.",
    "add_link_button": "Alt+l: specify the selected units as linked",
    "finish_button": "Alt+a: declare all units finished and saves (for finishing the unit in focus, press Alt+f).",
    "combine_button": "Alt+c: if two consecutive words are selected, combines them into one word; if a single word is selected, it segments it according to its non-alphanumeric characters.",
    "uncertain_button": "Alt+u: mark the annotation given to the selected unit as 'uncertain' or remove such a label.",
    "implicit_button": "Alt+i: adds an implicit unit (active only in remote-unit selection mode).",
    "save_button" : "Alt+s or Ctrl+s: Save",
    "unfit_button" : "Alt+n: Report this passage as unfit for annotation",
    "add_ref_button" : "Alt+p: enter mode for adding a co-referent to unit in focus",
    "comments_button" : "Alt+r: Write comments on this passage",
    "reset_button" : "Alt+x: Reset annotation",
    "help_button" : "?: Help",
    "home_button" : "Alt+h: Main Menu",
    "settings_button" : "Alt+t: Settings",
    "unanalyzable_button" : "Alt+z: set a unit as unanalyzable."
};


/* The html of the help screen */
HELP_SCREEN_HTML = "<div><p style='margin-top: 1em; color: red'>Warning: If you load a worked-out example, all unsaved changes will be discarded!</p>" + 
    "<p style='width: 20em'><a class='button' onclick=\"loadByXid\(846\)\">Load Worked-out Example #1</a></p>" +
    "<p style='width: 20em'><a class='button' onclick=\"loadByXid\(844\)\">Load Worked-out Example #2</a></p>" +
    "<p style='width: 20em'><a class='button' onclick=\"loadByXid\(843\)\">Load Worked-out Example #3</a></p>" +
    "<p style='width: 20em'><a class='button' onclick=\"loadByXid\(842\)\">Load Worked-out Example #4</a></p>" +
    "<p style='width: 20em'><a class='button' href=\"http://www.cs.huji.ac.il/~omria01/data/ucca_tutorial.pdf\">Load a short tutorial for the web application</a></p>";


    //"<p style='margin-top: 1em; color: red'>Note: the passages below have been corrected to accord with the most recent updates to the guidelines.</p>" + 
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(50\)\">Load Worked-out Example #1</a></p>" + 
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(52\)\">Load Worked-out Example #2</a></p>" + 
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(55\)\">Load Worked-out Example #3</a></p>" + 
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(63\)\">Load Worked-out Example #4</a></p>" +
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(92\)\">Load Reference Annotation of Training Passage #1</a></p>" +
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(132\)\">Load Reference Annotation of Training Passage #2</a></p>" + 
    //"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(198\)\">Load Reference Annotation of Training Passage #3</a></p>" +
/*"<p style='width: 20em'><a class='button' href=\"http://www.cs.huji.ac.il/~omria01/data/ucca_tutorial.pdf\">Load a short tutorial for the application</a></p>" + 
    "<p style='width: 20em'><a style='display: none' class='button henrybriceReview' onclick=\"loadByXid\(1213\)\">For Henry: review passage #1</a></p>" +
    "<p style='width: 20em'><a style='display: none' class='button henrybriceReview' onclick=\"loadByXid\(1227\)\">For Henry: review passage #2</a></p>" +
    "<p style='width: 20em'><a style='display: none' class='button hagitsReview' onclick=\"loadByXid\(1154\)\">For Hagit: review passage #1</a></p>" +
    "<p style='width: 20em'><a style='display: none' class='button hagitsReview' onclick=\"loadByXid\(1161\)\">For Hagit: review passage #2</a></p>" + 
    "<p style='width: 20em'><a style='display: none' class='button adminReview' onclick=\"loadByXid\(1161\)\">For Admin: review passage #1</a></p>";*/

//"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(\)\">For Hagit: review passage #1</a></p>" + 
//"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(842\)\">For Hagit: review passage #2</a></p>" + 
//"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(842\)\">For Ayelet: review passage #1</a></p>" +
//"<p style='width: 20em'><a class='button' onclick=\"loadByXid\(842\)\">For Ayelet: review passage #2</a></p>";




