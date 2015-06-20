var lastsel = -1;
var lastpid;
var currPid = -1;
$(document).ready(function(){
	$("#list").jqGrid({
        url: "/getProjects",
		mtype: "POST",
		datatype: "json",
		colNames: ['id','name', 'version', 'config'],
		colModel: [
		           {name:'id',key:true,index:'id',editable:false,width:30,sorttype:'int'},
		           {name:'name',index:'name',editable:true,edittype:"text",width:100},
		           {name:'version',index:'version',editable:true,edittype:"text",width:90},
		           {name:'config',index:'config',editable:true,edittype:"text",width:80}
		           ],
		           pager: '#pager',
		           viewrecords: true,
		           multiselect: true,
		           caption: "Projects",
		           sortname: 'id',
		           height: 250,
		           rowNum: 15,
		           autowidth: true,
		           rowList: [15, 30, 60],
		           onSelectRow: function(id) {
		           }

	});
	$('#add').dialog({
		autoOpen: false,
		width: 300,
		buttons: {
			"Ok": function() { 
				addProject();
				$(this).dialog("close"); 
			}, 
			"Cancel": function() { 
				$(this).dialog("close"); 
			} 
		}
	});
	$.ajax({
		url : "/getConfigFilenames",
		type: "POST",
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			if (a.filenames) {
				var arr=a.filenames;
				for (var i=0; i<arr.length; i++) {
					var option = document.createElement('option');
					option.setAttribute('value', arr[i]);
					option.appendChild(document.createTextNode(arr[i]));
					$("#prConfig").append(option);
				}
			}
		},
		error: function(data){
			error("Deletion failed");
		}
	});
});

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
		var ret = $("#list").jqGrid('getCell',s[i],'id');
		ids.push(ret);
	}
	$.ajax({
		url : "/hideProjects",
		type: "POST",
		data: "projects=" + ids,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			$('#list').trigger('reloadGrid');
		},
		error: function(data){
			error("Deletion failed");
		}
	});
}

function addProject() {
	var name=$("#prName").val();
	var version=$("#prVersion").val();
	var config=$("#prConfig").val();
	$.ajax({
		url : "/addProject",
		type: "POST",
		data: "name=" + name + "&version=" + version + "&config=" + config,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			else if (a.error) {
				error(a.error);
			}
			else {
				$('#list').trigger('reloadGrid');
				$("#prName").val('');
				$("#prVersion").val('');
			}
		},
		error: function(data){
			error("Failed");
		}
	});
}

function closeDialog() {
	$('#passageList').jqGrid('GridUnload');
	$("#darken").fadeOut('fast',null);
	$("#dialog").fadeOut('fast',null);
}