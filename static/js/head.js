var curPointerUnit;
var curPointerLoc;
var curControl;
function headDialogExit() {
	deselect();
	pointerLoc = curPointerLoc;
	changeFocus(curPointerUnit);
	curPointerUnit = null;
}
function headDialogNone() {
	refreshUnitSpan(pointerUnit.behead());
	pointerUnit.needsHead = false;
	closeDialog();
}
/**
 * if noDialog is true, the head was selected not via a dialog.
 */
function headDialogAccept(noDialog) {
    if (arguments.length == 0 || !noDialog) {
        var selectedHead = selectedUnits[0];
        closeDialog();
        toggleSelect(selectedHead);
    }
    if (singleUnitSelected() != -1) {
        unit = group();
    }
    else {
        unit = selectedHead.unitGroup;
    }
    /*
	if (arguments.length == 0) {
		unit = selectedUnits[0];
		if (unit.unitGroup != null) {
			unit = unit.unitGroup;
		}
        }
    */
	var parent = unit.parent;
	if (parent.unitGroup != null) {
		parent = parent.unitGroup;
	}
	if (parent.isPassage() || parent.isParagraph()) {
		return;
	}
        refreshUnitSpan(parent.behead());
        if (parent.setHead(unit)) {
            unit.setType(parent.type);
	}
    refreshUnitSpan(parent);
    refreshUnitSpan(unit);
}
function openHeadDialog() {
	var unit = null;
	var singleUnit = singleUnitSelected();
	curPointerUnit = pointerUnit;
	if (pointerUnit.unanalyzable) {
		printUserMessage("Unanalyzable units cannot be assigned a head.");
		return;
	}
	switch (singleUnit) {
	case 1:
		headDialogAccept(true);
		return;
		break;
	case -1:
		headDialogAccept(true);
		return;
		break;
	case 0:
		if (selectedUnits.length == 0) {
			unit = pointerUnit;
		}
		else {
			return;
		}
	}
	if (UNITTYPE[unit.type].headed && unit.length() > 1) {
		curPointerUnit = pointerUnit;
		curPointerLoc = pointerLoc;
		if (singleUnit) {
			deselect();
		}
		openDialog(3);
		var dialogUnitSpan = document.getElementById('chooseHeadUnitSpan');
		displaySentence(unit, dialogUnitSpan);
		changeFocus(unit);
		curControl = control;
		pointerLoc = 0;
		if (unit.isUnitGroup) {
			toggleSelect(unit.parts[0].units[0]);
		}
		else {
			toggleSelect(unit.units[0]);
		}
	}
	else {
		printUserMessage("Units of this type cannot be assigned a head.");
	}
}
