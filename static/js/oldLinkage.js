var curUnit1 = null;   //candidate for first slot of linkage.
var curUnit2 = null;   //candidate for second slot of linkage.
var areThereCandidates = false;
var linkageCounter = 0;
var setByMouse = false;

/*
 * The arrays of the tables in the linkage mode.
 */
var linkageModeUnit = null;
var linkageModeLinkedRight = null;
var linkageModeLinkedLeft = null;
var linkageModeNotLinked = null;

/**  
 * The Linkage class.
 * A linkage is a pair of units with a type. 
 */
function Linkage(unit1, unit2, linkType) {
        this.id = linkageCounter++;
        this.first = unit1;
        this.second = unit2;
        this.type = linkType;

        this.toString = function() {
            str = "(" + this.first.toString() + ", " + this.second.toString() + ") " + LINKTYPE[this.type].name;
            return str;
        };
        
        this.first.addLinkage(this);
        
        //returns 1 if the linkage contains the id in the first place, 2 in the second and 0 if neither
        this.containsId = function(unitId) {
            if (this.first.id == unitId) {
                return 1;
            }
            if (this.second.id == unitId) {
                return 2;
            }
            return 0;
        };
}
/**
 * Finds the candidate units and stores them in the global variables.
 * If there are none, returns 0. If there are, opens the dialog box.
 */
function setLinkageInit() {
    areThereCandidates = false;
    setByMouse = false;
    curUnit1 = null;
    curUnit2 = null;
    
    //Find the first clause. If there is a single unit selected, it takes it, if there are more, returns. 
    //If there are none, uses the first in the lru.
    if (singleUnitSelected() == 1) {
        curUnit1 = selectedUnits[0];
    }
    else if (singleUnitSelected() == -1) {
        curUnit1 = selectedUnits[0].unitGroup;
    }
    else if (selectedUnits.length == 0 && pointerUnit.id != 0) {
        curUnit1 = pointerUnit;
    }
    if (curUnit1 == null || !UNITTYPE[curUnit1.type].linkable) {
        return;
    }
    deselect();

    //Find the clause preceding it, and establish a link.
    var siblings = curUnit1.parent.units;
    var numSibling;
    if (curUnit1.isUnitGroup) {
        numSibling = siblings.indexOf(curUnit1.parts[0]);
    }
    else {
        numSibling = siblings.indexOf(curUnit1);        
    }
    for (var i = numSibling-1; i >= 0; i--) {
        var curSibling = siblings[i];
        if (curSibling.unitGroup != null) {
            curSibling = curSibling.unitGroup;
        }
        if (UNITTYPE[curSibling.type].linkable) { //if it's linkable
            curUnit2 = curSibling;
            break;
        }
    }
    if (curUnit2 == null) {
        areThereCandidates = false;
        return;
    }
    openDialog(4);
    areThereCandidates = true;
}
function setLinkageFinish(keypressed) {
    if (dialog) {
        closeDialog();
    }
    if (areThereCandidates == false) {
        return;
    }
    var linktype = convertKeyToLinkType(keypressed);
    if (linktype == -1) {
        return;
    }
    var curLink = alreadyLinked(curUnit1, curUnit2);
    if (!setByMouse) {
        if (curLink != null) {
            if (linktype != curLink.type) {
                openDialog(2, "Are you sure you want to change linkage type from " + 
                           LINKTYPE[curLink.type].name + " to " + LINKTYPE[linktype].name +
                           "?", changeLinkageType,[curLink, linktype]);
            }
        }
        else {
            var newLink = new Linkage(curUnit1, curUnit2, linktype);
            insertLinkageIcon(newLink);
        }
    }
    else {   //if set by mouse
        changeLinkageType(curLink, linktype);
    }
    areThereCandidates = false;
}
/**
 * The final part of the setLinkage.
 */
function changeLinkageType(curLink, newtype) {
    removeLinkageIcon(curLink);
    curLink.type = newtype;
    insertLinkageIcon(curLink);
}
/**
 * Changes the linkage type with the mouse. The linkage is between the unit with id1 and the unit with id2.
 */
function changeLinkTypeMouseInit(id1, id2) {
    curUnit1 = allUnits[id1];
    curUnit2 = allUnits[id2];
    areThereCandidates = true;
    setByMouse = true;
    openDialog(4);
}
//returns the linkage if the two units are already linked, null otherwise.
function alreadyLinked(unit1, unit2) {
    var curLinkages = unit1.linkages;
    for (index in curLinkages) {
        if (curLinkages[index].second == unit2) {
            return curLinkages[index];
        }
    }
    return null;
}
/*
 * Types of linkage units.
 */
var LINKTYPE = {
    0: {key: "n", keyCode: 78, code: "NOLINKAGE", name: "No Linkage", linkColor: "transparent"},
    1: {key: "c", keyCode: 67, code: "COOR", name: "Coordination", linkColor: "#ff0"},
    2: {key: "e", keyCode: 69, code: "ELABOR", name: "Elaboration of Preceding Unit", linkColor: "#f0f"},
    3: {key: "m", keyCode: 77, code: "INV_ELABOR", name: "Main of Preceding Unit", linkColor: "#0aa"},
    4: {key: "p", keyCode: 80, code: "PARANT", name: "Paranthetical", linkColor: "#77c"}
};
function convertLinkType(linkType) {
    for (index in LINKTYPE) {
        if (LINKTYPE[index].name == linkType) {
            return index;
        }
    }
}
/*
 * A utility function for converting the key (either as a number on the keyboard or a char to the index of the type.
 */
function convertKeyToLinkType(keyPressed) {
    for (var linktype in LINKTYPE) {
        if (LINKTYPE[linktype].keyCode == keyPressed) {
            return linktype;
        }
    }
    return -1;
}
/**
 * Inserts a linkage icon of some unit's id.
 */
function insertLinkageIcon(curLink) {
    var first = curLink.first;
    var second = curLink.second;
    
    //inserting into the first.
    var firstSpan = document.getElementsByClassName('unitSpan' + first.id)[0];
    var linkIcon = document.createElement('span');
    linkIcon.setAttribute('class', 'linkRight '+LINKTYPE[curLink.type].code+'linkIcon');
    linkIcon.setAttribute('id', 'rightLinkIcon'+first.id);
    linkIcon.setAttribute('onmouseup', 'changeLinkTypeMouseInit('+first.id+', '+ second.id+')');

    //inserting into the second.
    var temp =  document.getElementsByClassName('unitSpan' + second.id);
    var secondSpan = temp[0];
    if (second.isUnitGroup) {
        var secondBeginInd = second.parts[0].indexAsChild();
        var secondEndInd = second.parts[second.parts.length-1].indexAsChild();
        var firstInd = first.indexAsChild();
        if (!(secondBeginInd < firstInd && secondEndInd > firstInd)) { //if the first is between the parts of the second.
            for (var ind = 0; ind < temp.length; ind++) {
                if (temp[ind].innerHTML == second.parts[second.parts.length-1].toString()) {
                    secondSpan = temp[ind];
                    break;
                }
            }
        }
    }
    else {
        secondSpan = temp[0];
    }

    var linkIcon2 = document.createElement('span');
    linkIcon2.setAttribute('class', 'linkLeft '+LINKTYPE[curLink.type].code+'linkIcon');
    linkIcon2.setAttribute('id', 'leftLinkIcon'+second.id);
    linkIcon2.setAttribute('onmouseup', 'changeLinkTypeMouseInit('+first.id+', '+ second.id+')');

    //inserting the icons
    if ((firstSpan.getElementsByClassName('linkRight').length == 0) && 
        (secondSpan.getElementsByClassName('linkLeft').length == 0)) {
        firstSpan.insertBefore(linkIcon, firstSpan.childNodes[0]);
        secondSpan.appendChild(linkIcon2);
    }
}
/**
 *  Removes a linkage icon from a certain unit.
 */
function removeLinkageIcon(curLink) {
    var rightLinkIcon = document.getElementById('rightLinkIcon'+curLink.first.id);
    var leftLinkIcon = document.getElementById('leftLinkIcon'+curLink.second.id);
    if (rightLinkIcon != undefined) {
        rightLinkIcon.parentNode.removeChild(rightLinkIcon);
    }
    if (leftLinkIcon != undefined) {
        leftLinkIcon.parentNode.removeChild(leftLinkIcon);
    }
}
/**
 * Remove linkage.
 */
function removeLinkage(curLink) {
    removeLinkageIcon(curLink);
    var index1 = curLink.first.linkages.indexOf(curLink);
    curLink.first.linkages.splice(index1,1);
    var index2 = curLink.second.forwardLinkages.indexOf(curLink);
    curLink.second.forwardLinkages.splice(index2,1);
}
/**
 * Opens the linkage mode.
 */
function openLinkageMode() {
	var activeUnit = null;
	var singleUnit = singleUnitSelected();
	switch (singleUnit) {
	case 1:
		activeUnit = selectedUnits[0];
		break;
	case -1:
		activeUnit = selectedUnits[0].unitGroup;
		break;
	case 0:
		if (selectedUnits.length == 0) {
			activeUnit = pointerUnit;
		}
		else {
			return;
		}
	}
	if (!UNITTYPE[activeUnit.type].linkable) {
            return;
        }

        linkageModeLinkedLeft = new Array();
        linkageModeLinkedRight = new Array();
        linkageModeNotLinked = new Array();
        linkageModeUnit = activeUnit;
        
        openDialog(5);
        var linkageTable = document.getElementById('mainLinkageTable');
        buildLinkageModeDisplay(activeUnit, linkageTable);
}
/**
 * fills the table for the linkage mode display.
 */
function buildLinkageModeDisplay(focusUnit, linkageModeTable) {
    var precedingTable = document.getElementById("precedingClausesTable");
    addLinksToTable(precedingTable, focusUnit.linkages, true);
    
    var followingTable = document.getElementById("followingClausesTable");
    addLinksToTable(followingTable, focusUnit.forwardLinkages, false);
    
    // Adding the main span.
    var curClause = document.getElementById("currentClause");
    var textNode = document.createTextNode(abbreviateString(focusUnit.toString(), 40));
    curClause.appendChild(textNode);
    curClause.setAttribute("style", "width: 20em; text-align: center; border: 3px solid");
    
    // Adding the non-linked clauses.
    var mainLinkageTable = document.getElementById("otherClausesTable");
    addUnitsToTable(mainLinkageTable, getAllClauses(linkedUnits(focusUnit))); 
}
/**
 * Creates the span of a clause in the table.
 */
function createClauseSpan(left, curUnit, tableRow, link) {
    var textNode = document.createTextNode(abbreviateString(curUnit.toString(), 25));
    var arrowText;
    if (left) {
        arrowText = document.createTextNode("\u2192");
    }
    else {
        arrowText = document.createTextNode("\u2190");
    }
    var textSpan = document.createElement('span');
    textSpan.setAttribute('class', 'linkageModeUnit');
    textSpan.setAttribute('onmouseup', 'unlink(' + curUnit.id + ', event);');

    var arrowSpan = document.createElement('span');
    arrowSpan.setAttribute('class', LINKTYPE[link.type].code+"linkArrow linkageArrow");

    textSpan.appendChild(textNode);
    arrowSpan.appendChild(arrowText);
    
    if (left) {
        tableRow.insertCell(0).appendChild(textSpan);
        tableRow.insertCell(1).appendChild(arrowSpan);
    }
    else {
        tableRow.insertCell(0).appendChild(arrowSpan);
        tableRow.insertCell(1).appendChild(textSpan);
    }
}
/**
 * Adding already linked clauses to the table.
 * pre is true if it is to the "preceding" table, false if the "following" table.
 */
function addLinksToTable(table, linkages, pre) {
    if (table.rows.length == 0 && linkages.length == 0) {
        addEmptyRow(table);
    }
    if (linkages.length > 0) {
        removeEmptyRows(table);
    }
    if (pre) {
        linkageModeLinkedLeft = linkageModeLinkedLeft.concat(linkages);
    }
    else {
        linkageModeLinkedRight.concat(linkages);
    }

    var lastRow;
    for (var i=0; i < linkages.length; i++) {
        lastRow = table.insertRow(table.rows.length);
        if (pre) {
            createClauseSpan(pre, linkages[i].second, lastRow, linkages[i]);
        }
        else {
            createClauseSpan(pre, linkages[i].first, lastRow, linkages[i]);
        }
    }
}
/**
 * Adding non-linked clauses to the table.
 */
function addUnitsToTable(table, clauses) {
    if (table.rows.length == 0 && clauses.length == 0) {
        addEmptyRow(table);
    }
    if (clauses.length > 0) {
        removeEmptyRows(table);
    }
    linkageModeNotLinked.concat(clauses);
    
    var textSpan, textNode, newCell;
    for (var i=0; i < clauses.length; i++) {
        
        lastRow = table.insertRow(table.rows.length);
        textNode = document.createTextNode(abbreviateString(clauses[i].toString(), 25));
        textSpan = document.createElement('span');
        textSpan.setAttribute('class', 'linkageModeUnit');
        textSpan.setAttribute('onmouseup', 'addLink('+clauses[i].id+', event)');
        
        textSpan.appendChild(textNode);
        newCell = lastRow.insertCell(0);
        newCell.appendChild(textSpan);
    }
}
/**
 * Unlinks a unit that is linked. First removes the link and then moves its div from one table to another.
 */
function unlink(unitId, e) {
    // moves the linkage icon.
    removeClause(e, unitId, 1);
    addUnitsToTable(document.getElementById("otherClausesTable"), [allUnits[unitId]]);

    // finds the seeked linkage.
    var linkage = null;
    for (var i in linkageModeUnit.linkages) {
        if (linkageModeUnit.linkages[i].second.id == unitId) {
            linkage = linkageModeUnit.linkages[i];
            break;
        }
    }
    if (linkage == null) {
        for (i in linkageModeUnit.forwardLinkages) {
            if (linkageModeUnit.forwardLinkages[i].first.id == unitId) {
                linkage = linkageModeUnit.forwardLinkages[i];
                break;
            }
        }
    }

    // removes the linkage.
    removeLinkage(linkage);
}

/**
 * Adds a link to the unit with the unitId. This happens in the linkage mode.
 */
function addLink(unitId, e) {
    var newLinkage;
    removeClause(e, unitId, 0);
    if (linkageModeUnit.before(allUnits[unitId])) {
        newLinkage = new Linkage(allUnits[unitId], linkageModeUnit, 2);
        insertLinkageIcon(newLinkage);
        addLinksToTable(document.getElementById("followingClausesTable"), [newLinkage], false);
    }
    else {
        newLinkage = new Linkage(linkageModeUnit, allUnits[unitId], 2);
        insertLinkageIcon(newLinkage);
        addLinksToTable(document.getElementById("precedingClausesTable"), [newLinkage], true);
    }
}

/**
 * removes the clause from the unit in which it is situated. Also removes it from the relevant table.
 * whichTable should be 0 if it is the non-linked table or 1 if it is one of the two linked ones.
 */
function removeClause(e, unitId, whichTable) {
    // removes the pressed element.
    var targ = null;
    if (e.target) {
        targ = e.target;
    }
    else if (e.srcElement) {
        targ = e.srcElement;
    }
    // removes the current.
    if (targ.parentNode.parentNode.parentNode.rows.length == 1) {
        addEmptyRow(targ.parentNode.parentNode.parentNode);
    }
    targ.parentNode.parentNode.parentNode.removeChild(targ.parentNode.parentNode);
    
    var index;
    if (whichTable == 0) {
        index = linkageModeNotLinked.indexOf(allUnits[unitId]);
        if (index != -1) {
            linkageModeNotLinked.splice(index, 1);
        }
        else {
            errorPrinter(linkageModeNotLinked+"|"+allUnits[unitId]);
        }
    }
    else { //if it is another table
        index = linkArrIndexOf(unitId, linkageModeLinkedRight);
        if (index != -1) {
            linkageModeLinkedRight.splice(index, 1);
        }
        else {
            index = linkArrIndexOf(unitId, linkageModeLinkedLeft);
            if (index != -1) {
                linkageModeLinkedLeft.splice(index, 1);
            }
            else {
                errorPrinter("error in linkage.js");
            }
        }
    }
}
/**
 * Adds an empty row.
 */
function addEmptyRow(table) {
    var lastRow = table.insertRow(table.rows.length);
    lastRow.setAttribute('class', 'emptyRow');
    var textNode = document.createTextNode("--EMPTY--");
    var textSpan = document.createElement('span');
    textSpan.setAttribute('class', 'linkageModeUnit'); 
    textSpan.appendChild(textNode);
    lastRow.insertCell(0).appendChild(textSpan);
}

/**
 * Removes the empty rows in the table. The table has to have an id.
 */
function removeEmptyRows(table) {
    $("#"+table.id).find('.emptyRow').remove();
}

/**
 * returns the first index where the unit with that id appears in a linkage array. returns -1 otherwise.
 */
function linkArrIndexOf(unitId, arr) {
    for (var i=0; i < arr.length; i++) {
        if (arr[i].containsId(unitId) > 0) {
            return i;
        }
    }
    return -1;
}

/**
 * Returns true iff unit1 is the next unit after unit2 that is of a linkable type.
 */
function areLinkable(unit1, unit2) {
    if (unit1.parent != unit2.parent || !UNITTYPE[unit1.type].linkable || !UNITTYPE[unit2.type].linkable) {
        return false;
    }
    var parent = unit1.parent;
    var index;
    var unit2index = -1;
    for (index=0; index < parent.units.length; index++) {
        var curChild = parent.units[index];
        if (curChild == unit2 || (unit2.isUnitGroup && unit2.indexAsPart(curChild) >= 0)) {
            unit2index = index;
            continue;
        }
        if (unit2index >= 0) {
            if (curChild == unit1 || (unit1.isUnitGroup && unit1.indexAsPart(curChild) >= 0)) {
                return true;
            }
            else if (UNITTYPE[curChild.type].linkable) {
                return false;
            }
        }
    }
    return false;
}
