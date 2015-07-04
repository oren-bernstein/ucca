var lastsel = -1;
var lastpid;
var currPid = -1;
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
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
    return query_string;
} ();
	$("#list").jqGrid({
		datatype: "local",
		colNames: ['cid','name', 'description', 'parents','family'],
		colModel: [
		           {name:'cid',key:true,index:'lid',editable:false,width:30,sorttype:'int'},
		           {name:'name',index:'name',editable:true,edittype:"text",width:300},
		           {name:'description',index:'parents',editable:false,width:100},
		           {name:'parents',index:'source',editable:true,edittype:"text",width:90},
		           {name:'family',index:'version',editable:true,edittype:"text",width:80}
		        	   ],
		        	   pager: '#pager',
		        	   viewrecords: true,
		        	   multiselect: true,
		        	   caption: "Layers",
		        	   sortname: 'cid',
		        	   height: 250,
		        	   rowNum: 15,
		        	   autowidth: true,
		        	   rowList: [15, 30, 60],
	});

	$('#insert').dialog({
		autoOpen: false,
		width: 600,
		buttons: {
			"Ok": function() {
				insertPassage();
				$(this).dialog("close");
			},
			"Cancel": function() {
				$(this).dialog("close");
			}
		}
	});
	$('#upload').dialog({
		autoOpen: false,
		width: 600,
		buttons: {
			"Ok": function() {
				$("#uploadForm").ajaxSubmit({
					beforeSubmit: function () {
						error("Submitting!");
					},
					success: function(res) {
						if (res && res.msg) {
							error(res.msg);
						}
						else {
							error(null);
						}
						$("#list").clearGridData(false);
						fillGrid();
					},
					target: '#errormsg',
					dataType: 'json'
				});
				$(this).dialog("close");
			},
			"Cancel": function() {
				$(this).dialog("close");
			}
		}
	});
	$("#uploadForm").ajaxForm();
	$.ajax({
		url : "/getGroups",
		type: "POST",
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
			var arr=$.parseJSON(a);
			for (var i=0; i<arr.length; i++) {
				var option = document.createElement('option');
				option.setAttribute('value', arr[i].gid);
				option.appendChild(document.createTextNode(arr[i].name));
				$(".groups").append(option);
			}
		},
		error: function(data){
			error("Failed");
		}
	});

function fillGrid(tableId, layerId){
	$.ajax({
		url : "/getCategories?layerId=%d" % layerId,
		type: "POST",
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
			var arr=$.parseJSON(a);
			for (var i=0; i<arr.length; i++) {
                            try {
			        arr[i].passage = decodeURIComponent(arr[i].passage);
                            }
                            catch(err) {
                                $('#err').append(arr[i].pid+" ");
                            }
				$('#%d' % tableId).jqGrid('addRowData',arr[i].pid,arr[i]);
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
		var ret = $("#list").jqGrid('getCell',s[i],'pid');
		ids.push(ret);
	}
	$.ajax({
		url : "/hideLayers",
		type: "POST",
		data: "passages=" + ids,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			$("#list").clearGridData(false);
			fillGrid();
		},
		error: function(data){
			error("Deletion failed");
		}
	});
}

function newLayer(fromExistingLayers) {
    if(fromExistingLayers == false) {
        window.location.href = '/newLayer';
        return;
    }
	var s = $("#list").jqGrid('getGridParam','selarrrow');
	if (!s.length) {
		return;
	}
	var ids = new Array();
	var ids_encoded = "";
	for (var i = 0; i < s.length; i++) {
		var ret = $("#list").jqGrid('getCell',s[i],'lid');
		ids.push(ret);
		ids_encoded += "ids[]="+ret+"&"
	}
	window.location.href = '/newLayer?' + ids_encoded;
}

function closeDialog() {
	$('#list').jqGrid('GridUnload');
	$("#darken").fadeOut('fast',null);
	$("#dialog").fadeOut('fast',null);
}

});