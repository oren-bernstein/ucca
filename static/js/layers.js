var lastsel = -1;
var lastpid;
var currPid = -1;
$(document).ready(function(){
	$("#list").jqGrid({
		datatype: "local",
		colNames: ['lid','name', 'parents', 'source', 'version'],
		colModel: [
		           {name:'lid',key:true,index:'lid',editable:false,width:30,sorttype:'int'},
		           {name:'name',index:'name',editable:true,edittype:"text",width:300},
		           {name:'parents',index:'parents',editable:false,width:100},
		           {name:'source',index:'source',editable:true,edittype:"text",width:90},
		           {name:'version',index:'version',editable:true,edittype:"text",width:80}
		        	   ],
		        	   pager: '#pager',
		        	   viewrecords: true,
		        	   multiselect: true,
		        	   caption: "Layers",
		        	   sortname: 'lid',
		        	   height: 250,
		        	   rowNum: 15,
		        	   autowidth: true,
		        	   rowList: [15, 30, 60],
	});
	fillGrid();
});
function fillGrid(){
	$.ajax({
		url : "/getLayers",
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
				$('#list').jqGrid('addRowData',arr[i].pid,arr[i]);
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
		var ret = $("#list").jqGrid('getCell',s[i],'lid');
		ids.push(ret);
	}
	$.ajax({
		url : "/hideLayers",
		type: "POST",
		data: "layers=" + ids,
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
