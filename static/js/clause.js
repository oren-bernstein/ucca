var remoteAdd = null;
var categoryRemoteAdd = null;
var curPointerUnit;
var curPointerLoc;
var pointerUnitParent;
var remotePointerUnitIndex = -1;

function toggleRemoteAdd(unit, catnum) {
	if (unit == null) { // exiting remoteAdd mode.
	    document.getElementById('bodyDiv').style.cursor = 'default';
            $('body').css('cursor', 'default');
		$('#LRUruler').hide();
		$('#collapseImg').hide();
		$('#expandImg').show();
		$('#unitsLRUDiv').hide();

		remoteAdd = null;
		categoryRemoteAdd = null;
		$('.remote-mode-button').toggleClass('faded');
		$('.remoteUnit').removeClass('remoteUnit');
		$('.remoteAdd').removeClass('remoteAdd');
		$('.originalRemoteInstance').removeClass('originalRemoteInstance');
		//$('.remoteDelImg').hide();
		pointerLoc = curPointerLoc;
		deselect();
		changeFocus(curPointerUnit);
		$('.selected').removeClass('selected'); //to deselect the remotePointerUnitIndex
		remotePointerUnitIndex = -1; 
	} else if (refAdd == null && unit.parent != null && unit.parent.parent != null
			&& (unit.display || unit.isUnitGroup)) { // entering remoteAdd mode.
		document.getElementById('bodyDiv').style.cursor = "crosshair";// "url('gif/remote_cursor.gif'),
            $('body').css('cursor', 'crosshair');
		$('#LRUruler').show();
		$('#collapseImg').hide();
		$('#expandImg').show();
		//$('.remoteDelImg').show();

		remoteAdd = unit;
		categoryRemoteAdd = catnum;
		$('.remote-mode-button').toggleClass('faded');
		if (selectedUnits.length == 0) {
			if (unit.isUnitGroup) {
				toggleSelect(unit.parts[0].units[0]);
			} else {
				toggleSelect(unit.units[0]);
			}
		}
		curPointerUnit = pointerUnit;
		curPointerLoc = pointerLoc;
		for ( var j = 0; j < unit.remoteUnits.length; j++) {
			$('.unitSpan' + unit.remoteUnits[j].id).addClass('remoteUnit');
		}
		$('.unitSpan' + unit.id).addClass('remoteAdd');
	}
}
//catnum is the category number for the remote unit.
function checkAndChooseRemoteUnits(catnum) {
	if (remoteAdd != null) {
		toggleRemoteAdd(null);
		return;
	}
	else {
		deselect();
		removePointer();
		pointerLoc = 0;
		insertPointer();
		toggleRemoteAdd(pointerUnit, catnum);
		return;
	}
}

function checkAndAddRemote(id) {

	if (arguments.length > 0) {
		unit = allUnits[id];
	} else {
		if (remotePointerUnitIndex != -1) {
			unit = remoteAdd.remoteUnits[remotePointerUnitIndex];
			remotePointerUnitIndex = -1;
		} else {
			unit = selectedUnits[0];
		}
	}
	if (unit.unitGroup != null) {
		unit = unit.unitGroup;
	}

	//if an atom wrapper was chosen
	if (!(unit instanceof ImplicitUnit) && unit.units.length > 0 && (unit.units[0] instanceof Atom)) {
		//if it is an only child, select its parent.
		if (unit.parent.units.length == 1) {
			unit = unit.parent;
		}
		else {
			printUserMessage("Only units can be selected as remote units.");
			return;
		}
	}

	var index = remoteAdd.remoteUnits.indexOf(unit);
	if (index == -1) {
		if (remoteAdd.isAncestorOf(unit) || unit.isAncestorOf(remoteAdd)) {
			printUserMessage("Unit cannot be selected as remote.");
			return;
		}
		remoteAdd.addRemoteUnit(unit, categoryRemoteAdd);
		showSubtree(remoteAdd.id);
		buildSentenceDiv(unit, remoteAdd);
	} 
	else if (remoteAdd.units.indexOf(unit) == -1) {
		removeRemoteUnit(remoteAdd, unit);
		deselect();
		toggleRemoteAdd(null);
		return;
	} else {
		return;
	}

	deselect();
	//changeFocus(remoteAdd, remoteAdd.remoteUnits.indexOf(unit));
	toggleRemoteAdd(null);
}
function removeAllRemoteUnits(unit) {
	for ( var j = 0; j < unit.remoteUnits.length; j++) {
		removeRemoteUnit(unit, unit.remoteUnits[j]);
	}
}
function removeRemoteUnit(unit, remoteUnit) {
	unit.removeRemoteUnit(remoteUnit);
	$('#nodeDiv' + remoteUnit.id + 'at' + unit.id).remove();
	if (!unit.hasChildrenToDisplay()) {
		hideSubtree(unit);
	}
}
function remoteMouseDown(id) {
	if (remoteAdd != null) {
		var index = remoteAdd.remoteUnits.indexOf(allUnits[id]);
		changeFocus(remoteAdd, index);
	}
}
function remoteMouseUp(id) {
}
function addImplicitUnit() {
	var imp = new ImplicitUnit(remoteAdd);
	remoteAdd.addRemoteUnit(imp, categoryRemoteAdd);
	showSubtree(remoteAdd.id);
	buildSentenceDiv(imp, remoteAdd);
	deselect();
	//changeFocus(remoteAdd, remoteAdd.remoteUnits.indexOf(imp));    

	toggleRemoteAdd(null);
}

function openLRUtable(openOrClose) {
	if (arguments.length == 0) {
		$('#collapseImg').toggle();
		$('#expandImg').toggle();
		$('#unitsLRUDiv').toggle();
	}
	else if (openOrClose) {
		$('#collapseImg').show();
		$('#expandImg').hide();
		$('#unitsLRUDiv').show();
	}
	else {
		$('#collapseImg').hide();
		$('#expandImg').show();
		$('#unitsLRUDiv').hide();
	}
}
