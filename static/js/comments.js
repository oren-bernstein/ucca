var curRemarks = ""; //the current remarks for this passage.
var unitRemarks = new Array(); //remarks for a specific unit.
var defaultHeadText = "Insert your comments here. What would you change in the UI? " + 
    "Do you think this passage is suitable for annotation? How can the annotation scheme be improved?";
var curUnitId = null;

function openRemarksDialog(unitId) {
    if (arguments.length == 0) {
        openDialog(6, defaultHeadText, curRemarks);
        curUnitId = -1;
    }
    else {
        var curUnitRemarks;
        if (unitRemarks[unitId]) {
            curUnitRemarks = unitRemarks[unitId];
        }
        else {
            curUnitRemarks = "";
        }
        var curHeadText = "Please provide comments for the unit \"" + 
            allUnits[unitId].toString() + "\":";
        openDialog(6, curHeadText, curUnitRemarks);
        curUnitId = unitId;
    }
}

/**
 * The html for the remarks to be fed in by the users.
 */
function remarksHtml(headText, curText) {
    var res = "<div style='margin: 2px;'><p style='font-size: 10px;'>" + headText +
        "</div>" +
	"<textarea id='remarksInput' style='margin-left: 4px; font-size: 10px; width: 25em; height: 15em;'>" + 
        curText + "</textarea>" + 
	"<div style='position: absolute; bottom: 2px; right: 2px;'>" +
        "<a class='button' style='cursor: pointer; background: #eeeeee;' onclick='saveRemarks();'>Done [esc]</a></div>";
    return res;
}

/**
 * Saves remarks from the remarks dialog to a global variable.
 */
function saveRemarks() {
    if (curUnitId == -1) {
        curRemarks = document.getElementById('remarksInput').value;
    }
    else {
        unitRemarks[curUnitId] = document.getElementById('remarksInput').value;
    }
    curUnitId = null;
    closeDialog();
}
