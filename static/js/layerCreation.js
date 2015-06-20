itemNum = 0;
targetTypesNum = new Array();
UnitTypes = new Array();
UnitTypes[0] = {code: 'yes', name: 'Yes'};
UnitTypes[1] = {code: 'no', name: 'No'};

function addItem() {
	var itemDiv = "<div class='itemDiv' id='itemDiv"+itemNum+"'>"+
		"<p>Original type: <select id='selectItem" + itemNum +"'>";
	for (type in UnitTypes) {
		itemDiv += "<option value='"+UnitTypes[type].code+"'>"+UnitTypes[type].name+"</option>";
	}
	itemDiv +="</select></p><p><input id='isOverrideOptional"+itemNum+"' type='checkbox' checked='checked'/> is override optional?</p><div id='targetTypesItem"+itemNum+"'><input type='text' id='item"+itemNum+"targetType1'/><a onclick=addTargetType("+itemNum+")><img id='item"+itemNum+"Plus' src='gif/plus.gif'></img></a></div></div>";
	
	$(itemDiv).insertBefore("#refinementItems");
	targetTypesNum[itemNum] = 1;
	itemNum++;
}
function addTargetType(itemNum) {
	targetTypeP = "<p><input type='text' id='item"+itemNum+"targetType"+targetTypesNum[itemNum]+"'/><a onclick=addTargetType("+itemNum+")><img id='item"+itemNum+"Plus' src='gif/plus.gif'></img></a></p>";
	$('#item'+itemNum+'Plus').remove();
	$(targetTypeP).appendTo("#targetTypesItem"+itemNum);
	targetTypesNum[itemNum]++;
}
$(document).ready(function(){
	addItem();
});
function submit() {
	newUnitTypeArray = new Array();
	for (var i = 0; i < itemNum; i++){
		newUnitTypeArray[i].valid = true;
		newUnitTypeArray[i] = new Object();
		newUnitTypeArray[i].changedFrom = $("#selectItem" + itemNum);
		for (var k = 0; k < i; k++) {
			if (newUnitTypeArray[i].changedFrom == newUnitTypeArray[k].changedFrom) {
				newUnitTypeArray[i].valid = false;
				break;
			}  
		}
		if (targetTypesNum[i] > 0) {
			newUnitTypeArray[i].targetTypes = new Array();
			for (var j = 0; j < targetTypesNum[i]; j++){
				var targetType = $('#item'+i+'targetType'+j).value();
				if (targetType != "") {
					newUnitTypeArray[i].targetTypes.push(targetType);
				}
			}
			if (newUnitTypeArray[i].targetTypes.length() == 0) {
				newUnitTypeArray[i].valid = false;
			}
		}
		else {
			newUnitTypeArray[i].valid = false;
		}
		newUnitTypeArray[i].overrideOptional = $('#isOverrideOptional' + i).prop('checked');
	}
}