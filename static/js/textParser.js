var discardReferences = true;
/**
 * Parses the text into paragraphs and then parses each paragraph separately.
 * The output is an array where each entry is an array of strings corresponding to a paragraph.
 * if simpleParse is true, it only splits it by spaces and line feeds.
 */
function parseText(inpStr, simpleParse) {
    inpStr = strip(inpStr);
    var parags = inpStr.split(/\n\n+/g);
    var output = new Array();
    for (var i=0; i < parags.length; i++) {
        if (arguments.length == 2 && simpleParse) {
            output.push(parags[i].split(/\s+/g));
        }
        else {
            output.push(parseParagraph(parags[i]));
        }
    }
    return output;
}

/**
 * Parses a string which corresponds to a paragraph into a new string where words are separated by spaces.
 */
function parseParagraph(inpStr) {
    if (discardReferences) {
        inpStr = inpStr.replace(/\[[0-9]+\]/g, "");
    }
    
    inpStr = strip(inpStr);
    var inpWords = inpStr.split(/\s+/g);
    var i=0;
    var changed = false;
    while (i < inpWords.length) {
        changed = false;
        
        var lengthApostrophe = endsWithApostrophe(inpWords[i]);
        if (lengthApostrophe > 0 && lengthApostrophe < inpWords[i].length) {
            inpWords.splice(i+1,0,inpWords[i].substr(-1*lengthApostrophe));
            inpWords[i] = inpWords[i].substr(0, inpWords[i].length-lengthApostrophe);
            changed = true;
        }
        
        if (inpWords[i].length > 1 && endsWithApostrophe(inpWords[i]) == -1) {
	    var punctInd = inpWords[i].search(/\.\.\./);
	    if (punctInd > 0) {
		inpWords.splice(i+1,0,inpWords[i].substr(punctInd,3));
                addStr = inpWords[i].substring(punctInd+3);
                inpWords[i] = inpWords[i].substring(0, punctInd);
                if (addStr.length > 0) {
                    inpWords.splice(i+2,0,addStr);
                }
		changed = true;
	    }
	    
            if (inpWords[i].substr(-1) == "." || inpWords[i].substr(-1) == ",") {
                inpWords.splice(i+1,0,inpWords[i].substr(-1));
                inpWords[i] = inpWords[i].substr(0, inpWords[i].length-1);
                changed = true;
            }
	    
            punctInd = inpWords[i].search(/[\/;\:!\?\(\)\[\]\'\"\{\}\+&\%\$—<>—“”]/);
            if (punctInd > 0) {
                inpWords.splice(i+1,0,inpWords[i].substr(punctInd,1));
                addStr = inpWords[i].substring(punctInd+1);
                inpWords[i] = inpWords[i].substring(0, punctInd);
                if (addStr.length > 0) {
                    inpWords.splice(i+2,0,addStr);
                }
                changed = true;
            }
            else if (punctInd == 0) {
                inpWords.splice(i+1,0,inpWords[i].substring(punctInd+1));
                inpWords[i] = inpWords[i].substr(0,1);
                changed = true;
            }
        }

        if (!changed) {
            i++;
        }
    }
    return inpWords;
}
function strip(str) {
    return str.replace(/^\s*|\s*$/g,'');
}
function endsWith(str, suffix) {
    return (str.substr(-1*suffix.length) == suffix);
}      
function endsWithApostrophe(str) {
    var apostrophes = ["’s", "’s", "'s", "'m", "'re", "'ll", "'d", "'ve", "n't", "...", "’s"];
    for (var i=0; i < apostrophes.length; i++) {
        if (endsWith(str, apostrophes[i])) {
            return apostrophes[i].length;
        }
    }
    return -1;
}
function isPunctuation(str) {
    //var temp = str.replace(/[\'-\/;\:!\?\(\)\[\]\"\{\}\+&<>—“”\.,]+/, "");
    var temp = /^([^0-9A-Z%&a-zÀ-ÿ]+)$/;
    return temp.test(str);
}


