/**
 * 
 */
//functions of units LRU table.
function enqueueCurrentUnitToLRU() {
	//if a single unit is selected, enqueue it
	if (singleUnitSelected()) {
		enqueueToLRU(selectedUnits[0]);
	}
}
//enqueue a given unit in the LRU.
function enqueueToLRU(unit) {
    if (lruQueue.indexOf(unit) == -1) {
	lruQueue.unshift(unit);
	if (lruQueue.length > lruMaxSize) {
	    lruQueue.pop();
	}
        textInTable = abbreviateString(unit.toString(), maxNumChars);
	addRowToLruTableBottom(textInTable, unit, true);
    }
}
function removeFromLRU(unit) {
    index = lruQueue.indexOf(unit);
    if (index != -1) {
	lruQueue.splice(index,1);
    }
    $("#lruRow"+unit.id).remove();
}
function dequeueUnitToLRU() {
	if (lruQueue.length == 0) {
		return;
	}
	lruQueue.pop();
	deleteLastLRURow();
}
function refreshLRU() {
	var lruTable = document.getElementById('unitsLruUL');
	for (var i=lruTable.childNodes.length-1; i > 0; i--) {
		lruTable.removeChild(lruTable.childNodes[i]);
	}
	for (var i=0; i < lruQueue.length; i++) {
		var textInTable = lruQueue[i].toString();
		textInTable = abbreviateString(textInTable, maxNumChars);
		addRowToLruTableBottom(textInTable, lruQueue[i],i);
	}
}

//Inserts a cell with the text (rowText) in the bottom of the table.
//unit is the associated unit
function addRowToLruTableBottom(rowText, unit, topRow) {
    
    var lruTable = document.getElementById('unitsLruUL');
    var r = /\\u([\d\w]{4})/gi;
    rowText = rowText.replace(r, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16)); });
    var textNode = document.createTextNode(unescape(rowText));
    var bullet = document.createElement("div");
    bullet.setAttribute('class', 'square lruSquare' + unit.id + ' ' + UNITTYPE[unit.type].code+'bg');
    var textSpan = document.createElement("span");
    textSpan.setAttribute('id', 'lruUnit'+unit.id);
    textSpan.setAttribute('class', 'LRU unitSpan'+unit.id+' '+UNITTYPE[unit.type].code+'border '+active_display_class);
    if (!unit.parent.isParagraph()) {
        textSpan.setAttribute('title', 'CONTEXT:' + unit.parent.toString());
    }
    textSpan.appendChild(textNode);
    
    if (topRow) {
        var lastRow = lruTable.insertRow(lruTable.rows.length);
    }
    else {
        var lastRow = lruTable.insertRow(0);
    }
    lastRow.setAttribute('id', 'lruRow' + unit.id);
    var cell0 = lastRow.insertCell(0);
    cell0.appendChild(bullet);
    lastRow.insertCell(1).appendChild(textSpan);
    setMouseAttributesLruUnit(textSpan, unit);
}

//Deletes the last row from the display of the table.
function deleteLastLRURow() {
	var lruTable = document.getElementById('unitsLruUL');
	var lastElement = lruTable.childNodes.length-1;
	lruTable.removeChild(lruTable.childNodes[lastElement]);
}
//Sets the mouse attributes of a span in the lru unit.
//Unit is the associated unit.
function setMouseAttributesLruUnit(newSpan, unit) {
	newSpan.setAttribute('onmouseout', 'return lruMouseOut('
			+ unit.id + ', event)');
	newSpan.setAttribute('onmouseover', 'return lruMouseOver('
			+ unit.id + ', event)');
	newSpan.setAttribute('onmousedown', 'return lruMouseDown('
			+ unit.id +')');
	newSpan.setAttribute('onmouseup', 'return lruMouseUp('
			+ unit.id + ')');
	return newSpan;
}
//The functionality of moving the mouse over,out,down or up a box in the LRU list.
function lruMouseOver(unitId, event) {
}
function lruMouseOut(unitId, event) {
	$("#lruUnit"+unitId).removeClass("lruSelected");
}
function lruMouseUp(unitId) {
    $("#lruUnit"+unitId).removeClass("lruSelected");
    if (remoteAdd != null) {
	checkAndAddRemote(unitId);
        if (remoteAdd != null) {
            openLRUtable();//close the lru table.
        }
    }
    else if (refAdd != null) {
        checkAndAddReferent(unitId);
    }
    else {
	edit(allUnits[unitId]);
	jump(unitId);
    }
}
function lruMouseDown(unitId) {
	$("#lruUnit"+unitId).addClass("lruSelected");
}
/**
 * Jumps to a unit node from the lru
 */
function jumpToLruUnit(keynum) {
	if (-1 < keynum && keynum < 10 && lruQueue.length > keynum) {
                $("#lruUnit"+lruQueue[keynum].id).addClass('lruSelected');
		lruMouseUp(lruQueue[keynum].id);
	}
}

/**
 * Turn lru select mode on or off.
 */
function toggleLRUSelectMode(turnOn) {
    if (turnOn == cursorInLRU) { //i.e., the call is redundant
        return;
    }
    if (turnOn) {
        if (lruQueue.length > 0) {
            removePointer();
            cursorInLRU = true;
            deselect();
            lruCursorIndex = 0;
            toggleLRUSelect(lruCursorIndex, true);
        }
    }
    else {
        cursorInLRU = false;
        toggleLRUSelect(lruCursorIndex, false);
        //pointerLoc = 0;
        //changeFocus(pointerUnit);
        selectAfterSwitch();
        switchControl(true);
    }
}

function lruScrollToPointer() {
    if (!cursorInLRU) {
        return;
    }
    pointerPos = $(".lruSelected").offset().top;
    $('#unitsLRUDiv').scrollTop(pointerPos + $("#unitsLRUDiv").scrollTop() - Math.round($("#unitsLRUDiv").height() * 0.5));
}


