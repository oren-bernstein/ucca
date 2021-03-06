var tempLinkages, tempRemotes, tempReferents;
var IMPLICIT_LINKER_CODE = "IMPLICIT"; //the code for implicit linkers in the xml file.
var global_type = null;
var debug, debug_all;

/**
 * Addresses the conversion of the annotation into xml.
 */

// Creates the xml from the existing annotation. Returns it as a 
function createXML(passageID) {
	var xmlDocument;
	if (window.ActiveXObject) { //IE. COMPLETE!!
		xmlDocument  = new ActiveXObject('Microsoft.XMLDOM');
    }
    else { //Other browsers
        xmlDocument = document.implementation.createDocument('', 'root', null);
        xmlDocument.documentElement.setAttribute('schemeVersion', schemeVersion);

        if (right_to_left) {
            dir = 'rtl';
        }
        else { 
            dir = 'ltr';
        }
        xmlDocument.documentElement.setAttribute('direction', dir);

        var elem = xmlDocument.createElement('units');
        elem.setAttribute('passageID', passageID);
        var unitGroupsElem = xmlDocument.createElement('unitGroups');
        xmlDocument.documentElement.appendChild(unitGroupsElem);
        xmlDocument.documentElement.appendChild(elem);
        xmlAddUnitAndTree(xmlDocument, elem, allUnits[0]);
        
        //adding the lru status
        var lruElem = xmlDocument.createElement('LRUunits');
        for (var i=0; i < lruQueue.length; i++) {
            elem = xmlDocument.createElement('LRUunit');
            elem.setAttribute('id', lruQueue[i].id);
            lruElem.appendChild(elem);
        }
        xmlDocument.documentElement.appendChild(lruElem);

        //adding the hidden units status
        var hiddenUnits = xmlDocument.createElement('hiddenUnits');
        for (var i=0; i < isHidden.length; i++) {
            if (isHidden[i] == true) {
                elem = xmlDocument.createElement('hiddenUnit');
                elem.setAttribute('id', i);
                hiddenUnits.appendChild(elem);
            }
        }
        xmlDocument.documentElement.appendChild(hiddenUnits);
        
    }
    //alert(xmlToString(xmlDocument));
    return xmlToString(xmlDocument);
}

/**
 * Adds a child to an element with the specified attributes.
 */
function xmlAddUnit(doc, parent, id, type, isRemote, isImplicit) {
    var child;
    if (arguments.length == 4 || !isRemote) {
        child = doc.createElement('unit');
        child.setAttribute('type', type);
        child.setAttribute('id', id);
        if (unitRemarks[id]) {
            child.setAttribute('remarks', escapeRemark(unitRemarks[id], true));
        }
    }
    else {
        if (arguments.length == 6 && isImplicit) {
            child = doc.createElement('implicitUnit');
            child.setAttribute('id', id);
            child.setAttribute('type', UNITTYPE[type].name);
        }
        else {
            child = doc.createElement('remoteUnit');
            child.setAttribute('id', id);
            child.setAttribute('type', UNITTYPE[type].name);
        }
    }
    parent.appendChild(child);
    return child;
}

/**
 * xml add linkages.
 */
function xmlAddLinkage(doc, parent, linker, linkedArgs) {
    var child = doc.createElement('linkage');
    linkedArgsStr = '';
    for (ind in linkedArgs) {
        linkedArgsStr += linkedArgs[ind].id;
        if (ind < linkedArgs.length-1) {
            linkedArgsStr += ',';
        }
    }
    child.setAttribute('args', linkedArgsStr);
    parent.appendChild(child);
    return child;
}

function xmlToString(elem){
    var serialized;
    if (window.XMLSerializer) {
        serializer = new XMLSerializer();
        serialized = serializer.serializeToString(elem);
    } 
    else {
        serialized = elem.xml;
    }
    return serialized;
}

/**
 * Adds the unit and all its sub-units to the xml.
 */
function xmlAddUnitAndTree(doc, xmlElem, unit) {
    if (unit instanceof Atom) {
        var textNode = doc.createTextNode(unit.toString());
        var atomNode = doc.createElement('word');
        atomNode.setAttribute("id", unit.id);
        atomNode.appendChild(textNode);
        xmlElem.appendChild(atomNode);
        return textNode;
    }
    else {
        var newElem;
        if (unit == undefined) {
            throw TypeError("ddd");
        }
        newElem = xmlAddUnit(doc, xmlElem, unit.id, UNITTYPE[unit.type].name);

        if (unit.referent != null) {
            newElem.setAttribute("referent", unit.referent.id);
        }
        
        for (var j=0; j < unit.linkages.length; j++) {
            var curLinkage = unit.linkages[j];
            //linkages are always encoded on the linker
            if (curLinkage.linker == unit) {
                xmlAddLinkage(doc, newElem, curLinkage.linker, curLinkage.linkedArgs);
            }
        }
        
        if (unit.remoteUnits.length > 0) {
            for (var k=0; k < unit.remoteUnits.length; k++) {
                if (unit.remoteUnits[k] instanceof ImplicitUnit) {
                    xmlAddUnit(doc, newElem, unit.remoteUnits[k].id, unit.remoteTypes[k], true, true);
                }
                else {
                    xmlAddUnit(doc, newElem, unit.remoteUnits[k].id, unit.remoteTypes[k], true);
                }
            }
        }
        if (unit.unitGroup != null) { //if it is non-contiguous
            newElem.setAttribute("unitGroupID", unit.unitGroup.id);
            if (unit == unit.unitGroup.parts[0]) { //if it is the first part of the unit group...
                addUnitGroup(doc, unit.unitGroup);
            }
        }
        for (var i=0; i < unit.units.length; i++) {
            xmlAddUnitAndTree(doc, newElem, unit.units[i]);
        }
        newElem.setAttribute("unanalyzable", unit.unanalyzable);
        newElem.setAttribute("uncertain", unit.uncertain);
        return newElem;
    }
}

/**
 * adds a unit group to the document.
 */
function addUnitGroup(doc, unitGroup) {
    var parent = doc.getElementsByTagName("unitGroups")[0];
    xmlAddUnitAndTree(doc, parent, unitGroup);
}

/**
 * Parses a string into an xml and creates the hierarchy accordingly.
 */
function parseXML(xmlString) {
    tempLinkages = new Array();
    tempRemotes = new Array();
    tempReferents = new Array();
    allUnits = new Array();
    counter = 0;
    orderedLinkages = new Array();
    
    var xDoc;
    if (window.ActiveXObject) { //IE
        xDoc = new ActiveXObject("MSXML2.DOMDocument");
        xDoc.async = false;
        xDoc.loadXML(xmlString);
    }
    else {
        var dp = new DOMParser();
        xDoc = dp.parseFromString(xmlString, "text/xml");
    }
    
    dir = getAttribute(xDoc.documentElement, "direction");
    if (dir && dir == 'rtl') {
        right_to_left = true;
    }
    else {
        right_to_left = false;
    }
    
    // First pass - create units without links between them.
    var unitGroupsElem = xDoc.getElementsByTagName("unitGroups")[0];
    for (var i=0; i < unitGroupsElem.childNodes.length; i++) {
        createUnitGroup(unitGroupsElem.childNodes[i]);
    }
    
    var passageUnit = xDoc.getElementsByTagName("units")[0].childNodes[0];
    createUnitAndSubtreeByXML(passageUnit, null);
    
    // Setting referents
    for (var i=0; i < tempReferents.length; i++) {
        var refAdd = allUnits[tempReferents[i][0]];
        refAdd.setReferent(allUnits[tempReferents[i][1]]);
    }
    
    // Setting linkages
    var newLink;
    for (var i=0; i < tempLinkages.length; i++) {
        var curArgsStr  = tempLinkages[i][0].split(',');
        var curLinker = tempLinkages[i][1];
        curArgs = new Array();
        for (ind in curArgsStr) {
            curArgs.push(allUnits[curArgsStr[ind]]);
        }
        newLink = new Linkage(allUnits[curLinker], curArgs);
        pushLinkage(newLink);
    }
    
    // Setting remote units
    for (var i=0; i < tempRemotes.length; i++) { //each entry is the id of the parent, the id of the unit, a flag (true for implicit) and a type
        if (tempRemotes[i][2] == false) {
            allUnits[tempRemotes[i][0]].addRemoteUnit(allUnits[tempRemotes[i][1]], tempRemotes[i][3]);
        }
        else { // Implicit argument
            imp = new ImplicitUnit(allUnits[tempRemotes[i][0]], tempRemotes[i][1]);
	    allUnits[tempRemotes[i][0]].addRemoteUnit(imp, tempRemotes[i][3]);
        }
    }
    
    counter = allUnits.length;
    
    // Setting the LRU units
    var lruElem = xDoc.getElementsByTagName("LRUunits")[0];
    for (var i=0; i < lruElem.childNodes.length; i++) {
        var curID = getAttribute(lruElem.childNodes[i], "id");
        if (allUnits[curID]) {
            enqueueToLRU(allUnits[curID]);
        }
    }

    // Hiding the hidden units.
    var hiddenUnitsElem = xDoc.getElementsByTagName("hiddenUnits")[0];
    for (var k=0; k < hiddenUnitsElem.childNodes.length; k++) {
        var curID = getAttribute(hiddenUnitsElem.childNodes[k], "id");
        isHidden[curID] = true;
    }
    
    return xDoc;
}

//First pass: creates units with their id, type, parent and children.
function createUnitAndSubtreeByXML(xmlUnit, parentUnit) {

    global_type = getAttribute(xmlUnit, "type");    
    var type = convertUnitType(getAttribute(xmlUnit, "type"));

    var id = getAttribute(xmlUnit, "id");

    var referentId = getAttribute(xmlUnit, "referent");
    if (referentId != null) {
        tempReferents.push([id, referentId]);
    }

    var uncertain = getAttribute(xmlUnit, "uncertain");
    var curUnit = new Unit(parentUnit, null, id);

    var remarks = getAttribute(xmlUnit, "remarks");
    if (remarks != null) {
        unitRemarks[id] = escapeRemark(remarks, false);
    }

    var unanalyzable = getAttribute(xmlUnit, "unanalyzable");
    if (unanalyzable == "true") {
        curUnit.unanalyzable = true;
    }
    else {
        curUnit.unanalyzable = false;
    }

    if (uncertain == "true") {
        curUnit.uncertain = true;
    }
    else {
        curUnit.uncertain = false;
    }
    
    curUnit.id = id;
    curUnit.type = type;
    if (type != 1) {
        curUnit.defaultType = false;
    }
    
    curUnit.setDisplayVal(curUnit.isPassage() || curUnit.isParagraph() || UNITTYPE[type].display);
    
    var unitGroupID = getAttribute(xmlUnit, "unitGroupID");
    if (unitGroupID != null) {
        allUnits[unitGroupID].addPart(curUnit);
    }
    
    for (var i=0; i < xmlUnit.childNodes.length; i++) {
        var curChild = xmlUnit.childNodes[i];
        if (curChild.nodeName == "unit") { 
            var newUnit = createUnitAndSubtreeByXML(xmlUnit.childNodes[i], curUnit);
            curUnit.addChild(newUnit);
        }
        else if (curChild.nodeName == "word") {
        	if (curChild.childNodes[0] == undefined) {
        		continue;
        	}
            var newAtom = new Atom(curChild.childNodes[0].data, false, getAttribute(curChild, "id"));
            curUnit.addChild(newAtom);
        }
        else if (curChild.nodeName == "linkage") {
            var linkedArgs = getAttribute(curChild, "args");
            if (linkedArgs == null) {
                tempLinkages.push(readLegacyLinkageRepresentation(id, curChild));
            }
            else {
                var linker = curUnit.id;
                tempLinkages.push([linkedArgs, linker]);
            }
        }
        else if (curChild.nodeName == "remoteUnit" || curChild.nodeName == "implicitUnit") {
            var remoteID = getAttribute(curChild, "id");
            var remoteType = convertUnitType(getAttribute(curChild, "type"));
            tempRemotes.push([curUnit.id, remoteID, (curChild.nodeName == "implicitUnit"), remoteType]);
        }
    }

    return curUnit;
}

function getAttribute(xmlUnit, attributeName) {
    var val = xmlUnit.attributes.getNamedItem(attributeName);
    if (val != undefined) {
        return val.value;
    }
    return null;
}

function createUnitGroup(xmlElem, parent) {
    var id = getAttribute(xmlElem, "id");
    var type = convertUnitType(getAttribute(xmlElem, "type"));
    var remarks = getAttribute(xmlElem, "remarks");
    if (remarks != null) {
        unitRemarks[id] = escapeRemark(remarks, false);
    }
    var newUnitGroup = new UnitGroup(parent, id);
    newUnitGroup.type = type;
    newUnitGroup.defaultType = false;
    newUnitGroup.setDisplayVal(UNITTYPE[type].display);

    var uncertain = getAttribute(xmlElem, "uncertain");
    if (uncertain == "true") {
        newUnitGroup.uncertain = true;
    }
    else {
        newUnitGroup.uncertain = false;
    }

    var unanalyzable = getAttribute(xmlElem, "unanalyzable");
    if (unanalyzable == "true") {
        unanalyzable = true;
    }
    else {
        unanalyzable = false;
    }    
    newUnitGroup.setUnanalyzableVal(unanalyzable);

    //adding linkages
    for (var i=0; i < xmlElem.childNodes.length; i++) {
        var curChild = xmlElem.childNodes[i];
        if (curChild.nodeName == "linkage") {
            var args = getAttribute(curChild, "args");
            if (args == null) {
                tempLinkages.push(readLegacyLinkageRepresentation(id, curChild));
            }
            else {
                var linker = id;
                tempLinkages.push([args, linker]);
            }
        }
        else if (curChild.nodeName == "remoteUnit" || curChild.nodeName == "implicitUnit") {
            var remoteID = getAttribute(curChild, "id");
            var remoteType = convertUnitType(getAttribute(curChild, "type"));
            tempRemotes.push([id, remoteID, (curChild.nodeName == "implicitUnit"), remoteType]);
        }
    }
}

/**
 * Reads the representation of linkages in its old depricated representation.
 */
function readLegacyLinkageRepresentation(firstChildId, linkageElement) {
    var linkerID = getAttribute(linkageElement, "linker");
    var secondID = getAttribute(linkageElement, "toID");
    var args = firstChildId;
    if (secondID != EMPTY_ARGUMENT) {
        args += ',' + secondID;
    }
    return [args, linkerID];
}

/**
 * remark is a remark which should be escaped. flag should be true if we are adding escape characters,
 * and false if we are removing them.
 */
function escapeRemark(remark, flag) {
    if (flag) {
        return remark.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    else {
        return remark.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
    }
}
