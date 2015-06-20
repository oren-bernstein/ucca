/**
 * Make the necessary checks before submission, and if it passes them, submit the annotation.
 */
function checkAndSubmit() {
	if (mode=="review"){
		openDialog(2, "Are you sure you want to update the passage?", updatePassage);
	}
	else {
		for (index in allUnits[0].units) {
			var curParagraph = allUnits[0].units[index];
			for (index2 in curParagraph.units) {
				var curUnit = curParagraph.units[index2];
				if (curUnit.unitGroup != null) {
					curUnit = curUnit.unitGroup;
				}
				if (UNITTYPE[curUnit.type].code == "PUNCT") {
					continue;
				}
				else if (UNITTYPE[curUnit.type].code == "TBD") {
					printUserMessage('Some units are still not annotated.');
					return;
				}
				if (!curUnit.isFinished) {
					var violatingUnit = curUnit.toggleFinished();
					if (violatingUnit != null) {
						edit(allUnits[violatingUnit.id]);
						jump(violatingUnit.id);
						errorPrinter("Err:"+curUnit.id+" ");
						return;
					}
				}
				//hideUnit(curUnit);
			}
		}
		submit();
	}
}
