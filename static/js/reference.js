var refAdd = null; //the unit to which we add a referent
var refCurPointerUnit = null; //the pointer unit which we started in before selecting a referent.


function toggleAddReferent(unit) {
    if (unit == null) { // exiting addRef mode.
	document.getElementById('bodyDiv').style.cursor = 'default';
       
	refAdd = null;
	$('.refAdd').removeClass('refAdd');
        $('#LRUruler').hide();
        $('#collapseImg').hide();
        $('#expandImg').show();
        $('#unitsLRUDiv').hide();

        deselect();
	changeFocus(refCurPointerUnit);
    } else if (remoteAdd == null && unit.parent != null && unit.parent.parent != null
	       && (unit.display || unit.isUnitGroup)) { // entering addRef mode.
	document.getElementById('bodyDiv').style.cursor = "crosshair";
        
	refAdd = unit;
        $('#LRUruler').show();
        $('#collapseImg').hide();
        $('#expandImg').show();

	if (selectedUnits.length == 0) {
	    if (unit.isUnitGroup) {
		toggleSelect(unit.parts[0].units[0]);
	    } else {
		toggleSelect(unit.units[0]);
	    }
	}
	refCurPointerUnit = pointerUnit;
	$('.unitSpan' + unit.id).addClass('refAdd');
    }
}


// check if the unit is suitable as a unit to which a reference can be added.
function checkAndEnterRefMode() {
    if (refAdd != null) {
	toggleAddReferent(null);
	return;
    }
    else {
        deselect();
        removePointer();
        pointerLoc = 0;
	insertPointer();
	toggleAddReferent(pointerUnit);
	return;
    }
    
    /*
    switch (singleUnitSelected()) {
    case 1:
	toggleAddReferent(selectedUnits[0]);
	break;
    case -1:
	toggleAddReferent(selectedUnits[0].unitGroup);
	break;
    }
    */
}


// check and add the unit with the specified id as a referent
function checkAndAddReferent(id) {
    if (arguments.length > 0) {
	unit = allUnits[id];
    } else  {
	switch (singleUnitSelected()) {
	case 1:
            unit = selectedUnits[0];
	    break;
	case -1:
	    unit = selectedUnits[0].unitGroup;
	    break;
        case 0:
            unit = pointerUnit;
            if (unit.unitGroup != null) {
	        unit = unit.unitGroup;
            }
            break;
        }
    }

    //if an atom wrapper was chosen
    if (unit.units.length > 0 && (unit.units[0] instanceof Atom)) {
        //if it is an only child, select its parent.
        if (unit.parent.units.length == 1) {
            unit = unit.parent;
        }
        else {
            printUserMessage("Only units can be selected as referents.");
            return;
        }
    }

    //adding the referent
    if (refAdd.isAncestorOf(unit) || unit.isAncestorOf(refAdd)) {
        printUserMessage("Unit cannot be selected as a referent.");
        toggleAddReferent(null);
	return;
    }
    if (refAdd.referent != null) {
        removeReference();
    }
    refAdd.setReferent(unit);
    displayReferent(refAdd);

    deselect();
    toggleAddReferent(null);

}

// displays the reference of a unit.
function displayReferent(unit) {
    if (unit.referent == null) {
        return;
    }
    unitSentDiv = document.getElementById('sentDiv'+unit.id);
    
    refImg = document.createElement('img');
    refImg.setAttribute('class', 'ref' + unit.id);
    refImg.setAttribute('src', 'gif/ref_arrow.gif');
    refImg.setAttribute('style', 'vertical-align: middle; height: 1em; width: 2em; margin-left: 2em; display: inline;');
    refImg.setAttribute('title', 'press to remove reference');
    refImg.setAttribute('onclick', 'removeReference('+unit.id+'); toggleAddReferent(null);');
    
    refDiv = document.createElement('span');
    refDiv.setAttribute('class', 'refUnit '+active_display_class+' ref'+unit.id);
    refDiv.setAttribute('id', 'refDiv'+unit.id);
    refDiv.setAttribute('title', 'CONTEXT: '+ unit.referent.parent.toString());

    refDiv.innerHTML = unit.referent.toString();
    
    unitSentDiv.appendChild(refImg);
    unitSentDiv.appendChild(refDiv);

    $('#refDiv'+unit.id).click(function() {
        edit(unit.referent);
        jump(unit.referent.id);
    });

}
    
// remove the reference of a unit. if unitId is indicated it removes the reference in the unit with that id, if no arguments are, it uses refAdd (if exists).
function removeReference(unitId) {
    if (arguments.length == 0) {
        targetUnit = refAdd;
    }
    else {
        targetUnit = allUnits[unitId];
    }
    if (targetUnit != null && targetUnit != undefined) {
        targetUnit.setReferent(null);
        $('.ref'+targetUnit.id).remove();
    }
}




