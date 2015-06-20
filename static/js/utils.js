/** 
 *  Abbreviates str to be of size maxN, not cutting words in the middle.
 */
function abbreviateString(str, maxN) {
    str = strip(str);
    if (str.length <= maxN) {
        return str;
    }
    var wordArr = str.split(" ");
    var curLength = wordArr[0].length + wordArr[wordArr.length-1].length + 5;
    var maxIndex = 0;  //the index of a maximum word that is taken.
    if (curLength > maxN) { //first and last together are too long.
        return str;
    }
    var output = wordArr[0] + " ";
    while (curLength + wordArr[maxIndex+1].length + 1 <= maxN) { 
        maxIndex += 1;
        output = output + " " + wordArr[maxIndex];
        curLength = curLength + wordArr[maxIndex].length + 1;
    }
    return output + " ... " + wordArr[wordArr.length-1];
}

function strip(str) {
    return str.replace(/^\s+|\s+$/g,"");
}
/**
 * Sorts an array of units
 * @param arr an array
 * @returns the sorted array
 */
function sortArray(arr,parentIsInUnitGroup) {
	if (arr.length < 2) {
		return arr;
	}
	var newArr = new Array;
	var indArr = new Array;
	if (parentIsInUnitGroup) {
		for ( var i = 0; i < arr.length; i++) {
			var entered = false;
			var indices = findIndices(arr[i]);
			for ( var j = 0; j < indArr.length; j++) {
				if (indices[0] < indArr[j][0] ||
						(indices[0] == indArr[j][0] &&
								indices[1][0] < indArr[j][1][0])) {
					newArr.splice(j, 0, arr[i]);
					indArr.splice(j, 0, indices);
					entered = true;
					break;
				}
			}
			if (!entered) {
				newArr.push(arr[i]);
				indArr.push(indices);
			}
		}
	}
	else {
		for ( var i = 0; i < arr.length; i++) {
			var entered = false;
			var index = arr[i].parent.units.indexOf(arr[i]);
			for ( var j = 0; j < indArr.length; j++) {
				if (index < indArr[j]) {
					newArr.splice(j, 0, arr[i]);
					indArr.splice(j, 0, index);
					entered = true;
					break;
				}
			}
			if (!entered) {
				newArr.push(arr[i]);
				indArr.push(index);
			}
		}
	}
	return newArr;
}
// pauses for ms miliseconds.
function pause(ms) {
    ms += new Date().getTime();
    while (new Date() < ms){}
}
