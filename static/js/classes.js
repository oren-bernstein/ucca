/**
 * 
 */
var counter = 0;
var linkageCounter = 0;
var allUnits=new Array();
var XUNIT = 'X';
var X = 0;
var L = [];

/**
 * Create a new atom
 * @param text text representation
 * @param skippable whether or not the atom can be skipped during annotating (e.g. a space character)
 * @param specifiedID specifies the id of the atom (optional).
 * @returns {Atom} a new atom
 */
function Atom(text,skippable,specifiedID) {
	if (arguments.length == 3) {
		this.id = specifiedID;
		allUnits[specifiedID]  = this;
	}
	else {
		this.id=counter++;
		allUnits.push(this);
	}
	this.text=text;
	this.skippable=skippable;
	this.type=0;

	this.parent=null;

	this.toString = function() {
		return unescape(text);
	};
	this.length = function() {
		return 1;
	};
}
/**
 * Constructor for a sentence unit object. 
 * This object contains objects that are of types Atom or Unit in the units array.
 * if specifiedID is defined, it sets the unit to be with the indicated id. In that case, it does not update the counter.
 * @param units unit objects
 * @returns {Unit} a new unit
 */
function Unit(parent,units,specifiedID) {
    if (arguments.length == 2) {
	allUnits.push(this);
	this.id = counter++;
    }
    else {
	this.id = specifiedID;
	allUnits[specifiedID] = this;
    }
    this.parent = parent;
    this.units=new Array();
    if (units != null) {
	for (var i=0; i<units.length; i++) {
	    if (units[i] instanceof Atom) {
		this.units.push(units[i]);
	    }
	    else if (units[i] instanceof Unit) {
		this.units.push(units[i]);				
	    }
	    else {
		this.units.push(new Unit(this,[new Atom(units[i])]));
	    }
	    this.units[i].parent=this;
	}
    }
    this.type = 1;
    if ((this.units.length == 1) && (this.units[0] instanceof Atom)) {
    	var unitStr = this.units[0].toString();
    	var r = /\\u([\d\w]{4})/gi;
    	unitStr = unitStr.replace(r, function (match, grp) {
    		return String.fromCharCode(parseInt(grp, 16)); } );
    	if (!right_to_left && isPunctuation(unitStr)) {
    		this.type = 2;
    	}
    }
    /*if ((this.units.length == 1) && (this.units[0] instanceof Atom) && (isPunctuation(this.units[0].toString()))) {
	this.type = 2;
    }
    else {
	this.type = 1;
    }*/
    this.head = null; 
    this.needsHead = false;
    this.isUnitGroup = false;
    this.display = (this.id == 0);
    this.unitGroup = null;
    this.isFinished = false;
    this.linkages = new Array();
    this.remoteOf = new Array();
    this.referent = null;  //a unit to which a unit (usually a pronoun or similar) refers to
    this.remoteUnits = new Array();
    this.remoteTypes = new Array();
    this.unanalyzable = false;
    this.uncertain = false;
    this.defaultType = true;
    this.addChild = function(child) {
	child.parent = this;
	if (child.unitGroup != null) {
	    child.unitGroup.parent = this;
	}
	this.units.push(child);
    };
    this.toggleUncertainAnnotation = function() {
	this.uncertain = !this.uncertain;
    };
    this.length = function() {
	return this.units.length;
    };
    this.toString = function() {
	var t = this.units[0].toString();
	for (var i=1; i < this.units.length; i++) {
	    t += " " + this.units[i].toString();
	}
	return t;
    };
    this.hasChildrenToDisplay = function() {
	if (this.isUnitGroup) {
	    for ( var i = 0; i < this.parts.length; i++) {
		if (this.parts[i].hasChildrenToDisplay()) {
		    return true;
		}
	    }
	    return false;
	}
	else {
	    if (this.isPassage()) {
		for (var i = 0; i < this.units.length; i++) {
		    if (this.units[i].hasChildrenToDisplay()) {
			return true;
		    }
		}
		return false;
	    }
            if (UNITTYPE[this.type].code == "LINKER" && this.linkages.length) {
                return true;
            }
	    if (this.remoteUnits.length) {
		return true;
	    }
	    for ( var i = 0; i < this.units.length; i++) {
		if (this.units[i].unitGroup != null || this.units[i].display) {
		    return true;
		}
	    }
            
	    return false;
	}
    };
    this.setDisplayVal = function(val) {
        this.display = val;
    };
    this.setUnanalyzableVal = function(val) {
	this.unanalyzable = val;
    };
    this.setReferent = function(unit) {
        this.referent = unit;
    };
    this.setType = function(type) {
	if (!UNITTYPE[this.type].changable) {
	    return;
	}
	if (type == this.type) {
	    return;
	}
	if (UNITTYPE[type].code != "FUNCTION") {
	    this.defaultType = false;
	}
	//Remove all linkages.
	while (this.linkages.length > 0) {
	    removeLinkage(this.linkages[0]);
	}
	this.type = type;
	this.toggleUnfinished(); //the unit changed its type and is therefore not finished.
	this.behead();
	if (UNITTYPE[type].headed && !this.isSingleWord()) {
	    this.needsHead = true;
	}
	else {
	    this.needsHead = false;
	}
    };
    //unit is either the implicit unit (created beforehand) or the original unit which is supposed to be copied in case of a remote unit.
    this.addRemoteUnit = function(unit, type) {
        if (arguments.length < 2) {
            type = 1;
        }
	if (!unit.implicit) {
            for (var i = 0; i < this.remoteUnits.length; i++) {
		if (unit.before(this.remoteUnits[i])) {
		    this.remoteUnits.splice(i,0,unit);
                    this.remoteTypes.splice(i,0,type);
		    unit.remoteOf.push(this);
		    return this.remoteUnits[i+1];
		}
	    }
	    unit.remoteOf.push(this);
            this.remoteUnits.push(unit);
            this.remoteTypes.push(type);
	}
        else { //if it's implicit
	    this.remoteUnits.push(unit);
            this.remoteTypes.push(type);
        }
        return null;
    };
    //unit is either the implicit unit (created beforehand) or the original unit which is supposed to be copied in case of a remote unit.
    this.removeRemoteUnit = function(unit) {
	this.remoteUnits.splice(this.remoteUnits.indexOf(unit),1);
        this.remoteTypes.splice(this.remoteUnits.indexOf(unit),1);
        if (!unit.implicit) {
	    unit.remoteOf.splice(unit.remoteOf.indexOf(this),1);
	}
    };
    this.isAncestorOf = function(unit) {
	while (unit != null) {
	    if (this == unit) {
		return true;
	    }        
	    unit = unit.parent;
	}
	return false;
    };
    this.ancestorsArray = function() {
	var arr = new Array();
	var unit = this;
	while (unit != null) {
	    arr.push(unit);
	    unit = unit.parent;
	}
	return arr;
    };
    this.before = function(unit) {
	if (unit == this) {
	    return true;
	}
	var arr1 = this.ancestorsArray();
	var arr2 = unit.ancestorsArray();
        
	var unit1 = arr1.pop();
	var unit2 = arr2.pop();
	while (unit1 == unit2) {
	    unit1 = arr1.pop();
	    unit2 = arr2.pop();
	}
	//this means that this contains unit (if unit1 == undefined) or the other way around (if unit2 == undefined)
	var parent;
	if (unit1 == undefined || unit2 == undefined) {
	    return true;
	}
	else {
	    parent = unit1.parent;
	}
	if (parent.unitGroup != null) {
	    var ind1 = findIndices(unit1);
	    var ind2 = findIndices(unit2);
	    return (ind1[0] < ind2[0] || (ind1[0] == ind2[0] && ind1[1][0] < ind2[1][0]));
	}
	else {
	    return (modifiedIndexOf(parent, unit1)[0] < modifiedIndexOf(parent, unit2)[0]);
	}
    };
    this.setHead = function(unit) {
	if (UNITTYPE[this.type].headed && UNITTYPE[unit.type].code != "PUNCT") {
	    this.head = unit;
	    this.needsHead = false;
	}
	else {
	    printUserMessage("This unit cannot be set as head.");
	    return false;
	}
	this.toggleUnfinished();
	return true;
    };
    this.behead = function() {
	var prevHead = this.head;
	this.head = null;
	this.needsHead = true;
	this.toggleUnfinished();
	refreshUnitSpan(this);
	return prevHead;
    };
    this.isSingleWord = function() {
	if (this.isUnitGroup) {
	    return false;
	}
	else {
	    return (this.units.length == 1);
	}
    };
    //Mark this unit as finished. If any of its descendents is not finished, returns the descendent.
    this.toggleFinished = function() {
        var children;
        if (this.unitGroup != null) {
            if (this.unitGroup.parts.indexOf(this) == 0) {
                return this.unitGroup.toggleFinished();
            }
            else {
                return null;
            }
        }
        else {
            children = this.extractChildren();
        }
	for (unitIndex in children) {
            var cur_child = children[unitIndex];
            if (cur_child instanceof Atom) {
                return null;
            }
            if (cur_child.toggleFinished() != null) {
                return cur_child;
            }
	}
	if (!this.runFinishTests()) {
	    return this;
	}
	this.isFinished = true;
	return null;
    };
    //Returns the parent unit of a unit. works also for unit groups.
    this.get_parent = function() {
        if (this.parent.unitGroup == null) {
            return this.parent;
        }
        else {
            return this.parent.unitGroup;
        }
    };
    //Checking whether the unit is eligable for finishing.
    this.runFinishTests = function() {
        
        if (this.length()+this.remoteUnits.length == 1 || this.unanalyzable) {
            return true;
        }
        
        //check if top level units are of the right category
        if (this.parent.isParagraph()) {
            if (UNITTYPE[this.type].changable && UNITTYPE[this.type].code != "PARALLEL" && UNITTYPE[this.type].code != "LINKEDU" &&
                UNITTYPE[this.type].code != "LINKER" && UNITTYPE[this.type].code != "GROUND" && 
                UNITTYPE[this.type].code != "FUNCTION") {
                printUserMessage("Can't finish - Top level unit must be an F, L, H, G");
                return false;
            }
        }
        
	//check if linker was assigned.
	if (UNITTYPE[this.type].code == "LINKER") {
	    if (this.linkages.length == 0) {
                if (!setLinkageByDefault(this)) {
		    printUserMessage("Can't finish - Linker is not participating in any linkage.");
		    return false;
                }
	    }
	}
        
        var type_distribution = get_type_distribution(this.extractChildren(), this.remoteTypes);

        if (UNITTYPE[this.type].code in ["PARALLEL", "LINKEDU"]) {
            if (type_distribution["PROCESS"] == undefined && type_distribution["STATE"] == undefined) {
                printUserMessage("Can't finish - A parallel scene must be a scene.");
		return false;
            }
        }

        if (UNITTYPE[this.type].code == "FUNCTION") {
            printUserMessage("Function must be unanalyzable.");
	    return false;
        }
        
        //if it's a scene.
	if (type_distribution["PROCESS"] > 0 || type_distribution["STATE"] > 0 || type_distribution["PARTICIPANT"] > 0) {
            if (type_distribution["PROCESS"] == undefined && type_distribution["STATE"] == undefined) {
                printUserMessage("Can't finish - Every scene must have exactly one S or P (implicit or explicit).");
                return false;
            }
            if (type_distribution["PROCESS"] > 0 && type_distribution["STATE"] > 0) {
                printUserMessage("Can't finish - A scene cannot contain both an S and a P.");
                return false;
            }
            if (type_distribution["PROCESS"] > 1 || type_distribution["STATE"] > 1) {
                printUserMessage("Can't finish - A scene must have exactly one S or P.");
                return false;
            }
            if (["ADVERBIAL", "LINKER", "GROUND", "STATE", "PROCESS", "CONNECTOR", "RELATOR", "ROLEMARKER", "FUNCTION"].indexOf(UNITTYPE[this.type].code) > -1) {
                printUserMessage("Can't finish - Only Hs, As and Es or their Cs may be scenes.");
                return false;
            }
            else if (UNITTYPE[this.type].code == "CENTER") {
                cur_unit = this;
                while (!cur_unit.isParagraph() && ["ELABORATOR", "PARTICIPANT", "PARALLEL", "LINKEDU"].indexOf(UNITTYPE[cur_unit.type].code) == -1) {
                    L.push(cur_unit);
                    if (["ADVERBIAL", "LINKER", "GROUND", "STATE", "PROCESS", "CONNECTOR", "RELATOR", "FUNCTION", "ROLEMARKER"].indexOf(UNITTYPE[cur_unit.type].code) > -1) {
                        printUserMessage("Can't finish - Only Hs, As and Es or their Cs may be scenes.");
                        return false;
                    }
                    cur_unit = cur_unit.get_parent();
                }
            }
            if (type_distribution["PROCESS"] > 1 || type_distribution["STATE"] > 1) {
                printUserMessage("Can't finish - Every scene must have exactly one S or P (implicit or explicit).");
	        return false;
            }
            
            var val = keysOnly(type_distribution, ["PROCESS", "STATE", "PARTICIPANT", "ADVERBIAL", "GROUND", "RELATOR", "ROLEMARKER", "FUNCTION", "PUNCT"]);
            if (!val) {
                printUserMessage("Can't finish - a scene can contain only P or S, As, Ds, Gs and Fs.");
            }
            return val;
        }
        
        //if center/elaborator structure
        if (type_distribution["CENTER"] > 0) {
            var val = keysOnly(type_distribution, ["CENTER", "ELABORATOR", "RELATOR", "ROLEMARKER", "FUNCTION", "PUNCT"]) || keysOnly(type_distribution, ["CENTER", "CONNECTOR", "FUNCTION", "PUNCT"])
                || (UNITTYPE[this.type].code == "CENTER" && keysOnly(type_distribution, ["CENTER", "ELABORATOR", "RELATOR", "ROLEMARKER", "FUNCTION", "PUNCT", "ADVERBIAL"]));
            if (!val) {
                printUserMessage("Can't finish - a complex unit may contain only Cs, Es, Rs and Fs.");
            }
            if (type_distribution["ELABORATOR"] > 0 && type_distribution["CENTER"] > 1) {
                printUserMessage("Can't finish - Only one C is allowed when an E is present.");
                val = false;
            }

            return val;
        }
        
        //if it's not single-worded or unanalyzable, but there are TBDs
        if (type_distribution["TBD"] > 0) {
            printUserMessage("Can't finish - unannotated units. If a unit is unanalyzable, tag it as such.");
            return false;
        }
        
        //the only other option is linkage
        if (this.parent.isParagraph()) {
            var val = keysOnly(type_distribution, ["LINKER", "PARALLEL", "LINKEDU", "FUNCTION", "PUNCT", "GROUND"]);
        }
        else {
            var val = keysOnly(type_distribution, ["LINKER", "PARALLEL", "LINKEDU", "FUNCTION", "PUNCT", "GROUND", "RELATOR", "ROLEMARKER"]);
        }
        if (!val) {
            printUserMessage("Can't finish - Units of inconsistent categories.");
            return false;
        }
                    
	return true;
    };
    //Marks a unit and all its descendents not finished.
    this.toggleUnfinished = function() {
	this.isFinished = false;
	for (unitIndex in this.units) {
	    if (!(this.units[unitIndex] instanceof Atom)) {
		this.units[unitIndex].toggleUnfinished();
	    }
	}
    };
    //adds a linkage to the unit. doesn't check if the linkage already exists.
    this.addLinkagePrivate = function(curLinkage) {
	this.linkages.push(curLinkage);
    };
    this.removeLinkagePrivate = function(linkage) {
	this.linkages.splice(this.linkages.indexOf(l), 1);
    };
    /**
     * Returns true if the two units are siblings and otherUnit is the most recent sibling.
     */
    this.isPrecedingSibling = function(other) {
        if (this.parent == null) { //if root
            return false;
        }
        if (this.parent != other.parent) {
            return false;
        }
        var curUnitIndex;
        if (this.isUnitGroup) {
            curUnitIndex = this.parent.units.indexOf(this.parts[0]);
        }
        else {
            curUnitIndex = this.parent.units.indexOf(this);
        }
        var otherUnitIndex;
        if (other.isUnitGroup) {
        	otherUnitIndex = other.parent.units.indexOf(other.parts[other.parts.length-1]);
        }
        else {
            otherUnitIndex = other.parent.units.indexOf(other);
        }

        for (var i=otherUnitIndex+1; i < curUnitIndex; i++) {
            if (this.parent.units[i].isDisplayable()) {
                return false;
            }
        }
        return true;
    };
    this.isPassage = function() {
	return (this.parent == null);
    };
    this.isParagraph = function() {
	if (this.isPassage()) {
	    return false;
	}
	return this.parent.isPassage();
    };
    /**
     * the index of the unit as a child of his parent.
     */
    this.indexAsChild = function() {
	for (var index=0; index < this.parent.units.length; index++) {
	    if (this.parent.units[index] == this) {
		return index;
	    }
	}
    };
    this.isLinker = function() {
	return (UNITTYPE[this.type].code == "LINKER");
    };
    this.isLinkable = function() {
        return (UNITTYPE[this.type].linkable);
    };
    this.isDisplayable = function() {
        return (UNITTYPE[this.type].display);
    };
    /**
     * Returns the children of a unit. handles also nested discontiguous units.
     * Does not necessarily return them in any specific order.
     */
    this.extractChildren = function() {
        var work = new Array();
        var children = new Array();
        if (this.isUnitGroup) {
            for (var ind in this.parts) {
                work.push(this.parts[ind]);
            }
        }
        else {
            for (var ind in this.units) {
                work.push(this.units[ind]);
            }
        }
        while (work.length > 0) {
            a = work.pop();
            if (a.unitGroup == null) {
                children.push(a);
            }
            else {
                if (a.unitGroup == this) {
                    for (var ind in a.units) {
                        work.push(a.units[ind]);
                    }
                }
                else {
                    if (children.indexOf(a.unitGroup) == -1) {
                        children.push(a.unitGroup);
                    }
                }
            }
        }
        return children;
    };
    /*
    this.isDefaultPosLinker = function() {
	if (!this.isLinker()) {
	    return false;
	}
	//are there linkages where it participates.
	if (this.linkages.length == 0) {
	    return false;
	}
	return this.linkages[0].defaultLinkerPos();
    };
    */
}
/**
 * Linker is the linker used for the linkage. linkedArgs are the units linked by the linker.
 */
function Linkage(linker, linkedArgs) {

    this.id = linkageCounter++;
    this.linkedArgs = linkedArgs;
    for (ind in linkedArgs) {
        linkedArgs[ind].addLinkagePrivate(this);
    }
    this.linker = linker;
    linker.addLinkagePrivate(this);
    this.isLink = true;
    
    this.toString = function() {
        str = "(";
        for (ind in this.linkedArgs) {
            str += this.linkedArgs[ind].toString();
            if (ind < this.linkedArgs.length-1) {
                str += ',';
            }
        }
	str += ") " + linker.toString();
	return str;
    };
    
    this.linkerText = function() {
	return linker.toString();
    };

}

/**
 * Returns all the indices where unit appears as a unit of a parent. If unit is contiguous, it is at most one index. Otherwise,
 * it is the indices of all the parts.
 */
function modifiedIndexOf(parent, unit) {
    if (parent == null || unit == null) {
        return null;
    }
    var output = new Array();
    for (var i=0; i < parent.units.length; i++) {
        if (parent.units[i] == unit) {
            return [i];
        }
        if (parent.units[i].unitGroup == unit) {
            output.push(i);            
        }
    }
    return output;
}

function stringToUnits(str, simpleParse) {
    counter = 0;
    allUnits = [];
    var text = parseText(str, simpleParse);
    var unit = new Unit(null,null);
    for (var i = 0; i < text.length; i++) {
	var temp = new Unit(null,text[i]);
	unit.addChild(temp);
    }
    return unit;
}
function ImplicitUnit(parent, specifiedID) {
    if (arguments.length < 2) {
	allUnits.push(this);
	this.id = counter++;
    }
    else {
	this.id = specifiedID;
	allUnits[specifiedID] = this;
    }
    this.parent = parent;
    this.implicit = true;
    this.toString = function() {
	return "IMPLICIT UNIT";
    };
    this.ancestorsArray = function() {
	var arr = new Array();
	var unit = this;
	while (unit != null) {
	    arr.push(unit);
	    unit = unit.parent;
	}
	return arr;
    };
}
function UnitGroup(parent, specifiedID) {
    var g;
    if (arguments.length == 2) {
	g = new Unit(null,null,specifiedID);
    }
    else {
	g = new Unit(null,null);
    }
    g.isUnitGroup = true;
    g.parts = new Array();
    g.parent = parent;
    g.type = 48;
    g.addPart = function(part) {
	g.parts.push(part);
	part.unitGroup = g;
    };
    g.length = function() {
	var res = 0;
	for ( var i = 0; i < g.parts.length; i++) {
	    res += g.parts[i].units.length;
	}
	res += g.parts.length - 1;
	return res;
    };
    g.toString = function() {
	res = g.parts[0];
	for ( var i = 1; i < g.parts.length; i++) {
	    res += "... " + g.parts[i];
	}
	return res;
    };
    /**
     * The index of the part in the group. -1 if it is not a part.
     */
    g.indexAsPart = function(unit) {
	for (var index=0; index < g.parts.length; index++) {
	    if (g.parts[index] == unit) {
		return index;
	    }
	}
	return -1;
    };

    return g;
}
/**
 * There should be only one like this in each session.
 */
function Passage(paragraphs) {
	allUnits.push(this);
	this.id = counter;
	counter++;
	this.units = new Array();
	if (units != null) {
		for (var i=0; i< paragraphs.length; i++) {
			if (units[i] instanceof Paragraph) {
				this.units.push(unit);
			}
			else { //an array of text.
				var parag = new Paragraph(this, paragraphs[i]);
				this.units.push(parag);
			}
		}
	}
}
/**
 * A paragraph. units can be either of the class Unit, of the class Atom or an array of strings.
 */
function Paragraph(parent, units) {
	allUnits.push(this);
	if (parent instanceof Passage) {
		this.parent = parent;
	}
	else {
		errorPrinter("Attempted to assign a non passage as a parent of a paragraph!");
	}
	this.id = counter;
	counter++;
	this.units = new Array();
	if (units != null) {
		for (var i=0; i<units.length; i++) {
			if (units[i] instanceof Atom) {
				this.units.push(new Unit(this,[units[i]]));
			}
			else if (units[i] instanceof Unit) {
				this.units.push(units[i]);				
			}
			else {
				this.units.push(new Unit(this,[new Atom(units[i])]));
			}
			this.units[i].parent=this;
		}
	}
}
/**
 * Returns a string of the unit's entire text.
 */
function unitToText(unit) {
	if (unit instanceof Atom) {
		return unit.text;
	}
	else {
		var t="";
		for (var i=0; i<unit.units.length; i++) {
			t+=unitToText(unit.units[i]);
		}
		return t;
	}
}
/**
 * For debugging only!
 * @param unit
 * @returns
 */
function unitTree(unit,count) {
	if (unit instanceof Atom) {
		return unit.id + " "+ unit.text + " " + unit.parent.id;
	}
	else {
		var res = unit.id + " " + unitToText(unit) + " " + unit.parent.id + "<br>";
		var minuses = "-";
		for ( var i = 0; i < count; i++) {
			minuses += "-";
		}
		for ( var int = 0; int < unit.units.length; int++) {
			res += minuses + unitTree(unit.units[int],count + 1) + "<br>";
		}
	}
	return res;
}
/**
 * Searches the unit in its parent unit and returns the unit's indices
 * @param unit a given unit
 * @returns null if unit is null or unit is not found. Otherwise, the function
 * returns a 2-cell array, in which the first coordinate is the index of the
 * parent's subunit containing the unit and the second coordinate the index
 * of the unit in the parent's subunit's units array.
 * in other words, it's the part index and the all the indices of the unit parts of unit in the parent..
 */
function findIndices(unit) {
	if (unit == null || unit.parent == null) {
		return null;
	}
	var group = unit.parent.unitGroup;
	if (group == null) {
		return null;
	}
	for ( var j = 0; j < group.parts.length; j++) {
	    var i = modifiedIndexOf(group.parts[j], unit);
	    if (i != null && i.length > 0) {
		return [j, i];
	    }
	}
	return null;
}
/**
 * Returns all the clauses, except for the ones in the "omitted" array.
 *
function getAllClauses(omitted) {
	var output = new Array();
	for (var i=0; i < allUnits.length; i++) {
		if (UNITTYPE[allUnits[i].type].code == "CLAUSE" && omitted.indexOf(allUnits[i]) == -1) {
			output.push(allUnits[i]);
		}
	}
	return output;
}
 */

/**
 * returns true if the associative array A contains only elements that come from K.
 */
function keysOnly(A, K) {
	for (var k in A) {
		if (K.indexOf(k) == -1) {
			return false;
		}
	}
	return true;
}

/*
 * Receives a unit type's name and returns its code.
 */
function convertUnitType(typeName) {
    if (schemeVersion == "1.0.4") {
        if (typeName == 'Linked U') {
            typeName = 'Parallel Scene';
        }
        else if (typeName == 'Role Marker') {
            typeName = 'Relator';
        }
    }
    if (schemeVersion == "1.0.3") {
        if (typeName == 'Parallel Scene') {
            typeName = 'Linked U';
        }
        else if (typeName == 'Relator') {
            typeName = 'Role Marker';
        }
    }
    for (index in UNITTYPE) {
	if (UNITTYPE[index].name == typeName) {
	    return index;
	}
    }
}

/**
 * Get type distribution of the list of units.
 * remoteTypes is an additional set of types which should be added to the distribution.
 */
    function get_type_distribution(units, remoteTypes) {
        var type_distribution = {};
        
        for (var ind in units) {
            curChild = units[ind];
	    var temp = type_distribution[UNITTYPE[curChild.type].code];
	    if (temp == undefined) {
	        temp = 0;
	    }
	    type_distribution[UNITTYPE[curChild.type].code] = temp + 1;
        }
        //adding remote units types
        for (var ind in remoteTypes) {
            var curType = remoteTypes[ind];
	    var temp = type_distribution[UNITTYPE[curType].code];
	    if (temp == undefined) {
	        temp = 0;
	    }
	    type_distribution[UNITTYPE[curType].code] = temp + 1;
        }
        
        return type_distribution;
    }
    
    
/**
 * Adds an associative arrays A and B and returns their sum
 */
function add_to_array(A, B) {
    for (key in A) {
        if (B[key] == undefined) {
            B[key] = 0;
        }
        B[key] = B[key] + A[key];
    }
    return B;
}

/**
 * Performs one iteration of the finish method.
 * Returns null if all is ok, and returns the v
 */
function localFinishCheck(unit) {
    if (cur_child instanceof Atom) {
        return null;
    }
    if (cur_child.toggleFinished() != null) {
        return cur_child;
    }
}

/**
 * A sort function of units based on 'before'.
 */
function unitSortFunction(unit1, unit2) {
    if (unit1 == unit2) {
        return 0;
    }
    else if (unit1.before(unit2)) {
        return -1;
    }
    return 1;
}
        
var UNITTYPE = {
    0: {numkey: "", code: "WORD", name: "Word", bgColor: "transparent", borderColor: "transparent",
	display: false, headed: false, linkable: false, changable:true},
    1: {key: "", code: "TBD", name: "To Be Defined", bgColor: "transparent", borderColor: "transparent",
	display: false, headed: false, linkable: false, changable:true}, 
    2: {numkey: "", code:"PUNCT", name: "Punctuation", bgColor: "transparent", borderColor: "transparent",
	display: false, headed: false, linkable: false, changable: false},
    48: {numkey: "0", key: "f", code: "FUNCTION", abbr: "F", name: "Function", caption: "<u>F</u>unction", bgColor: "#a1a1a1", borderColor: "#c3c3c3",
	 display: true, headed: false, linkable: false, changable: true, 
         space: true,
         title: "a part of the construction without substantial semantic input"}
};


var KEYINVENTORY = [
    {bgColor: "#444267", borderColor: "#444267"},
    {bgColor: "#0c9640", borderColor: "#0c9640"},
    {bgColor: "#AACC55", borderColor: "#AACC55"},
    {bgColor: "#db3937", borderColor: "#db3937"},
    {bgColor: "#9302d9", borderColor: "#9302d9"},
    {bgColor: "#ef86af", borderColor: "#ef86af"},
    {bgColor: "#ff7b23", borderColor: "#ff7b23"},
    {bgColor: "#3f32fe", borderColor: "#3f32fe"}, 
    {bgColor: "#cb9d02", borderColor: "#cb9d02"}, 
    {bgColor: "#935754", borderColor: "#935754"},
    {bgColor: "#4099b7", borderColor: "#4099b7"},
    {bgColor: "#444267", borderColor: "#444267"},
    {bgColor: "#0c9640", borderColor: "#0c9640"},
    {bgColor: "#AACC55", borderColor: "#AACC55"},
    {bgColor: "#db3937", borderColor: "#db3937"},
    {bgColor: "#9302d9", borderColor: "#9302d9"},
    {bgColor: "#ef86af", borderColor: "#ef86af"},
    {bgColor: "#ff7b23", borderColor: "#ff7b23"},
    {bgColor: "#3f32fe", borderColor: "#3f32fe"}, 
    {bgColor: "#cb9d02", borderColor: "#cb9d02"}, 
    {bgColor: "#935754", borderColor: "#935754"}
];



