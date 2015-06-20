var linker = null;
var linkageMode = false;
var editLinkageMode = false;
var curLinkage = -1;
var EMPTY_ARGUMENT = "EMPTY_ARG";
var orderedLinkages = new Array();

/**
 * Receives a set of units. If it includes exactly one linker and between one and two other linkable units,
 * it creates linkage between them. If the linker already participated in another linkage, it removes the previous linker.
 */
function createOrRemoveLinkage(unitSet) {
    if (unitSet.length < 2) {
        printUserMessage('Not enough units selected for linkage.');
        return;
    }
    var curLinker = null;
    var args = new Array();
    var curArgIndex = 0;
    
    var curUnit = null;
    for (var i=0; i < unitSet.length; i++) {
        if (unitSet[i].unitGroup) {
            curUnit = unitSet[i].unitGroup;
        }
        else if (UNITTYPE[unitSet[i].type].code == "PUNCT") {
            continue;
        }
        else {
            curUnit = unitSet[i];
        }
        
        if (curUnit.isLinkable()) { 
            if (args.indexOf(curUnit) == -1) {
                args[curArgIndex] = curUnit;
                curArgIndex++;
            }
        }
        else if (curUnit.isLinker()) {
            if (curLinker == null) {
                curLinker = curUnit;
            }
            else if (curUnit != curLinker) {
                printUserMessage("More than one Linker selected.");
                return;
            }
        }
        else {
            printUserMessage("Unsuitable units for linkage.");
            return;
        }
    }
    if (args.length == 0 || curLinker == null) {
        printUserMessage("Not enough units for linkage.");
        return;
    }
    //ordering the units
    args = args.sort(unitSortFunction);

    //if reached here, then the input is sound (one linker and other linkable units).
    if (curLinker.linkages.length > 0) {
        removeLinkage(curLinker.linkages[0]);
    }
    var l = new Linkage(curLinker, args);
    pushLinkage(l);
    displayLinkage(l);
}
function pushLinkage(link) {
    var index = 0;
    while (index < orderedLinkages.length) {
        if (link.linkedArgs[0].before(orderedLinkages[index].linkedArgs[0])) {
	    orderedLinkages.splice(index,0,link);
	    return;
	}
	index++;
    }
    orderedLinkages.push(link);
}
function popLinkage(link) {
    var index = orderedLinkages.indexOf(link);
    if (index != -1) {
	orderedLinkages.splice(index,1);
    }
}
function findNextLinkable(unit, right) {
    if (unit.isUnitGroup) {
        if (right) {
            unit = unit.parts[unit.parts.length-1];
        }
        else {
            unit = unit.parts[0];
        }
    }
    unit = sibling(unit, right);
    
    while (unit != null && !UNITTYPE[unit.type].linkable) {
        if (unit.isUnitGroup) {
            if (right) {
                unit = unit.parts[unit.parts.length-1];
            }
            else {
                unit = unit.parts[0];
            }
        }
	unit = sibling(unit, right);
        if (unit != null && unit.unitGroup != null) {
            unit = unit.unitGroup;
        }
    }
    return unit;
}
function removeLinkage(link) {
    removeLinkageDivs(link);
    unmarkDefaultLinkerPos(link.linker);
    
    for (ind in link.linkedArgs) {
        var index = link.linkedArgs[ind].linkages.indexOf(link);
        link.linkedArgs[ind].linkages.splice(index,1);
    }
    
    var index3 = link.linker.linkages.indexOf(link);
    link.linker.linkages.splice(index3,1);
    
    popLinkage(link);
}
/**
 * If unit is a linker and there is only one option to link it (it has only two siblings which are linkable),
 * it sets the linkage and returns true. Otherwise, returns false.
 */
function setLinkageByDefault(unit) {
    if (unit.parent.isParagraph()) {
        return false;
    }
    if (UNITTYPE[unit.type].code == "LINKER") {
        linkable_units = new Array();
        var parent = unit.parent;
        if (parent.unitGroup != null) {
            parent = parent.unitGroup;
            for (var k=0; k < parent.parts.length; k++) {
                for (var j=0; j < parent.parts[k].units.length; j++) {
                    var cur_child = parent.parts[k].units[j];
                    if (cur_child.unitGroup != null) {
                        cur_child = cur_child.unitGroup;
                    }
                    if (UNITTYPE[cur_child.type].linkable) {
                        linkable_units.push(cur_child);
                    }
                }
            }
        }
        else {
            for (var k=0; k < parent.units.length; k++) {
                cur_child = parent.units[k];
                if (cur_child.unitGroup != null) {
                    cur_child = cur_child.unitGroup;
                }
                if (UNITTYPE[cur_child.type].linkable) {
                    linkable_units.push(cur_child);
                }
            }
        }
        if (linkable_units.length >= 2) {
            var l = new Linkage(unit, linkable_units);
            pushLinkage(l);
            displayLinkage(l);
            return true;
        }
    }
    return false;
}

/**
 * selecting the current unit as the second in the linkage.
 */
function linkageMousedblclick(id,e) {
    linkageMousedown(id, e);
    linkageSpace();
}

/**
 * Returns true if the linkages formed by the selected units are crossing each other.
 * That is, returns false iff unitArr contain units with all their linked units.
 */
function crossingLinkages(unitArr) {
    for (var k=0; k < unitArr.length; k++) {
        var unit1 = unitArr[k];
        if (unit1.unitGroup != null) {
            unit1 = unit1.unitGroup;
        }
        for (var i=0; i < unit1.linkages.length; i++) {
            if (!containsAllLinkageUnits(unit1.linkages[i], unitArr)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Returns true iff all the units of the linkage l are contained in A
 */
function containsAllLinkageUnits(l, A) {
    if ($.inArray(l.linker, A) == -1) {
        return false;
    }
    for (ind in l.linkedArgs) {
        if ($.inArray(l.linkedArgs[ind], A) == -1) {
            return false;
        }
    }
    return true;
}

/**
 * what linkages are included in this set of units. The unitArr is assumed to be non-crossing (see crossingLinkages).
 */
function relevantLinkages(unitArr) {
    var output = new Array();
    for (var l=0; l < unitArr.length; l++) {
        var curUnit = unitArr[l];
        if (curUnit.unitGroup != null) {
            curUnit = curUnit.unitGroup;
        }
        for (var k=0; k < curUnit.linkages.length; k++) {
            if (output.indexOf(curUnit.linkages[k]) == -1) {
                output.push(curUnit.linkages[k]);
            }
        }
    }
    return output;
}

/** 
 * Returns true if x is a unit inside units.
 */
function isIncluded(units, x) {
    if (x == null) {
        return true;
    }
    for (var i=0; i < units.length; i++) {
        if (units[i] == x || units[i].unitGroup == x) {
            return true;
        }
    }
    return false;
}

function markDefaultLinkerPos(linkerUnit) {
    var linkerSentDiv = document.getElementById("sentDiv"+linkerUnit.id);
    var linkerSentSpan = document.getElementById("sentSpan"+linkerUnit.id);
    
    var linkIcon = document.createElement('img');
    linkIcon.setAttribute('src', 'gif/link.png');
    linkIcon.setAttribute('id', 'linkIcon'+linkerUnit.id);
    linkIcon.setAttribute('style', 'vertical-align: middle;');
    //linkIcon.setAttribute('title', "LINKS (1) '" + linkerUnit.linkages[0].first.toString() + "' and (2) '" + linkerUnit.linkages[0].second.toString()+ "'");
    linkerSentDiv.insertBefore(linkIcon, linkerSentSpan);


    /*
    $('#linkIcon'+linkerUnit.id).mouseout(function() {
        $(".unitSpan"+linkerUnit.first.id).removeClass("firstSelected");
        $(".unitSpan"+linkerUnit.second.id).removeClass("secondSelected");
    });
    */

    $('#linkIcon'+linkerUnit.id).mouseover(function(e) {
        var linkerId = e.target.id.substring(8);
        errorPrinter(linkerId);
        for (ind in allUnits[linkerId].linkages[0].linkedArgs) {
            $(".unitSpan"+allUnits[linkerId].linkages[0].linkedArgs[ind].id).addClass("linkageUnit");
            $("#sentDiv"+allUnits[linkerId].linkages[0].linkedArgs[ind].id).addClass("linkageSentDiv");
        }
    });
    $('#linkIcon'+linkerUnit.id).mouseleave(function(e) {
        var linkerId = e.target.id.substring(8);
        for (ind in allUnits[linkerId].linkages[0].linkedArgs) {
            $(".unitSpan"+allUnits[linkerId].linkages[0].linkedArgs[ind].id).removeClass("linkageUnit");
            $("#sentDiv"+allUnits[linkerId].linkages[0].linkedArgs[ind].id).removeClass("linkageSentDiv");
        }
    });
    
}

function unmarkDefaultLinkerPos(linkerUnit) {
    $("#linkIcon"+linkerUnit.id).remove();
}

function displayLinkage(l) {
    markDefaultLinkerPos(l.linker);
    showSubtree(l.linker.id);
    
    // forming the list of linked args

    var lastId = null;
    for (var ind=l.linkedArgs.length-1; ind >= 0; ind--) {
        buildSentenceDiv(l.linkedArgs[ind], l.linker, lastId);
        lastId = l.linkedArgs[ind].id;
    }
}



/* Depricated Functions
function toggleAddLinkageMode() {
}
function linkageSideways(right) {
}
function switchLinkage(next) {
}
function linkageSpace() {
}
function linkageMousedown(id,e) {
}
*/


