var lastsel = -1;
var lastpid;
var currPid = -1;
var layerId = -1;
$(document).ready(function(){
var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = [pair[1]];
     }
     else {
      query_string[pair[0]].push(pair[1]);
    }
  }
    return query_string;
} ();
    if(QueryString.layerId){
        layerId = QueryString.layerId[0];
        getLayerName();
    }
    else {
        createNewLayer(QueryString.parentId);
        window.location.href = window.location.href +
        (window.location.href.includes('?') ? '&' : '?')
        + 'layerId='+layerId;
		return;
    }
	$("#list").jqGrid({
		datatype: "local",
		colNames: ['cid','name', 'description', 'parents','family'],
		colModel: [
		           {name:'cid',key:true,index:'lid',editable:false,width:30,sorttype:'int'},
		           {name:'name',index:'name',editable:true,edittype:"text",width:300},
		           {name:'description',index:'parents',editable:true,width:100},
		           {name:'parents',index:'source',editable:false,edittype:"text",width:90},
		           {name:'family',index:'version',editable:true,edittype:"text",width:80}
		        	   ],
		        	   pager: '#pager',
		        	   viewrecords: true,
		        	   multiselect: true,
		        	   caption: "Your Layer",
		        	   sortname: 'cid',
		        	   editurl: "/editCategory",
		        	   height: 250,
		        	   rowNum: 15,
		        	   autowidth: true,
		        	   rowList: [15, 30, 60],
		        	   onSelectRow: function(id) {
		        		   if (id && id != lastsel) {
		        			   $("#list").jqGrid('saveRow',lastsel,null,"/editCategory",{'cid':lastpid});
		        			   lastpid = $("#list").jqGrid('getRowData',id).pid;
		        			   $("#list").jqGrid('editRow',id,true,null,null,"/editCategory",{'cid':lastpid});
		        			   lastsel = id;
		        		   }
		        	   }
	});
    fillGrid("list", layerId)


    if(QueryString.parentId){
        for(i = 0; i < QueryString.parentId.length ; i++){
            var listName = "parent" + QueryString.parentId[i]+"list"
            $("#parentLists").append('<table id="'+listName+'"><tr><td /></tr></table>'+
            '<div id="pager'+listName+'"></div>'+
            '<div id="buttons'+listName+'"></div>'+
            '<br />');
            $("#"+listName).jqGrid({
		datatype: "local",
		colNames: ['cid','name', 'description', 'parents','family'],
		colModel: [
		           {name:'cid',key:true,index:'lid',editable:false,width:30,sorttype:'int'},
		           {name:'name',index:'name',editable:true,edittype:"text",width:300},
		           {name:'description',index:'parents',editable:false,width:100},
		           {name:'parents',index:'source',editable:true,edittype:"text",width:90},
		           {name:'family',index:'version',editable:true,edittype:"text",width:80}
		        	   ],
		        	   pager: '#pager'+listName,
		        	   viewrecords: true,
		        	   multiselect: true,
		        	   caption: "Parent Layer",
		        	   sortname: 'cid',
		        	   height: 250,
		        	   rowNum: 15,
		        	   autowidth: true,
		        	   rowList: [15, 30, 60],
	});
            fillGrid(listName, QueryString.parentId[i]);
            addParentLayerButtons(listName);
        }

    }

	$('#insert').dialog({
		autoOpen: false,
		width: 600,
		buttons: {
			"Ok": function() {
				insertCategory();
				$(this).dialog("close");
			},
			"Cancel": function() {
				$(this).dialog("close");
			}
		}
	});
});

function addParentLayerButtons(listName){
    $("#buttons"+listName).append(
    '<a onclick="cloneFromList(\''+listName+'\');" href="#" class="ui-state-default ui-corner-all">'
    +'<span style="float: left;" class="ui-icon ui-icon-newwin"></span>Clone selected</a><br/>'
    );
}

function cloneFromList(listName){
    var s = $("#"+listName).jqGrid('getGridParam','selarrrow');
	if (!s.length) {
		return;
	}
	for (var i = 0; i < s.length; i++) {
		var id = $("#"+listName).jqGrid('getCell',s[i],'cid');
		var name = $("#"+listName).jqGrid('getCell',s[i],'name');
		var description = $("#"+listName).jqGrid('getCell',s[i],'description');
		var family = $("#"+listName).jqGrid('getCell',s[i],'family');

	    $.ajax({
		url : "/insertCategory",
		type: "POST",
		data: {name:  name, description: description, family: family, lid: layerId, parents: id},
		dataType: "text",
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
				return;
			}
		},
		error: function(data){
			error("Insertion failed");
		}
	    });
	}
	$("#list").clearGridData(false);
	fillGrid("list",layerId);
}

function fillGrid(tableId, layerId){
	$.ajax({
		url : "/getCategories",
		type: "POST",
		data: "layerId=" + layerId,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
			var arr=$.parseJSON(a);
			for (var i=0; i<arr.length; i++) {
				$('#' + tableId).jqGrid('addRowData',arr[i].cid,arr[i]);
			}
		},
		error: function(data){
			error("Failed");
		}
	});
}
function error(msg) {
	if (msg == null) {
		$('#error').hide();
		return;
	}
	$('#error').show();
	$('#errormsg').html(msg);
}

function hideSelected() {
	var s = $("#list").jqGrid('getGridParam','selarrrow');
	if (!s.length) {
		return;
	}
	var ids = new Array();
	for (var i = 0; i < s.length; i++) {
		var ret = $("#list").jqGrid('getCell',s[i],'cid');
		ids.push(ret);
	}
	$.ajax({
		url : "/hideCategories",
		type: "POST",
		data: "categories=" + ids,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			$("#list").clearGridData(false);
			fillGrid("list",layerId);
		},
		error: function(data){
			error("Deletion failed");
		}
	});
}

function createNewLayer(parentIds) {
	if(typeof(parentIds) === 'undefined'){
		parentIds = []
	}
    $.ajax({
        async: false,
        type: "POST",
        url: "/createNewLayer",
        data: {parentIds: parentIds},
		dataType: "text",
        success: function(a) {
            layerId = a;
        },
        error: function(data){
			error("New layer creation failed");
		}
    });
}

function insertCategory() {
	name=$('#name').val();
	description=$('#description').val();
	family=$('#family').val();
	$('#name').val("");
	$('#description').val("");
	$('#family').val("");

	$.ajax({
		url : "/insertCategory",
		type: "POST",
		data: {name:  name, description: description, family: family, lid: layerId},
		dataType: "text",
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
				return;
			}
			$("#list").clearGridData(false);
			fillGrid("list",layerId);
		},
		error: function(data){
			error("Insertion failed");
		}
	});
}

function closeDialog() {
	$('#list').jqGrid('GridUnload');
	$("#darken").fadeOut('fast',null);
	$("#dialog").fadeOut('fast',null);
}

function clearDefaultName() {
	if($("#layerName").val() == 'Name this layer...'){
		$("#layerName").val("");
	}
}

function getLayerName() {
    $.ajax({
		url : "/getLayerName",
		type: "POST",
		data: {layerId: layerId},
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
				return;
			}
			$("#layerName").val(a);
		},
	});
}

function renameLayer() {
	name = $("#layerName").val();

		$.ajax({
		url : "/renameLayer",
		type: "POST",
		data: {name:  name, lid: layerId},
		dataType: "text",
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
				return;
			}
		},
		error: function(data){
			error("Layer naming failed");
		}
	});
}