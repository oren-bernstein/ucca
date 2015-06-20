var dialogStep="";
var annotationsArr = new Array();
$(document).ready(function(){
	$("#list").jqGrid({
	    url: '/getReviewTasks',
	    datatype: "json",
	    mtype: "POST",
	    height: 250,
            width: 500,
            colNames: ['id', 'username', 'uid', 'project', 'pid', 'passage', 'status'],
            colModel: [
                {name:'id',index:'id',editable:false,width:50},
                {name:'username',index:'username',editable:false,width:90},
                {name:'uid',hidden:true,index:'uid',editable:false},
                {name:'project',index:'project',editable:false,width:50},
                {name:'pid',index:'pid',editable:false,width:50},
                {name:'passage',index:'passage',editable:false,width:50},
                {name:'status',index:'status',editable:false,width:50},
            ],
            rowNum: 15,
            rowList:[15,30,60],
            pager: '#pager',
            sortname: 'id',
            viewrecords: true,
            multiselect: true,
            caption: "Review Tasks"
	});
	$('#addTasks').dialog({
		autoOpen: false,
		width: 600,
		buttons: {
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
					},
					success: function(res) {
						if (res && res.msg) {
							error(res.msg);
						}
						else {
							error(null);
						}
						$("#list").trigger('reloadGrid');
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

});
function error(msg) {
	if (msg == null) {
		$('#error').hide();
		return;
	}
	$('#error').show();
	$('#errormsg').html(msg);
}
function addTasksDialog() {
	$('#addTasks').dialog('open');
	$('#dialogList').jqGrid('GridUnload');
	$("#dialogList").jqGrid({
		url: '/annotationsForReview',
		datatype: "json",
		mtype: "POST",
		height: 250,
		width: 500,
		colNames: ['xid', 'passage', 'user', 'project'],
		colModel: [
		           {name:'xid',index:'xid',editable:false,width:50},
		           {name:'passage',index:'passage',editable:false,width:90},
		           {name:'user',index:'user',editable:false,width:90},
		           {name:'project',index:'project',editable:false,width:90}
		           ],
		           rowNum: 15,
		           rowList:[15,30,60],
		           pager: '#pager',
		           sortname: 'xid',
		           viewrecords: true,
		           multiselect: true,
		           caption: "Annotations"
	});
	dialogStep = "annotations";
}

function usersStep() {
	$('#dialogList').jqGrid('GridUnload');
	$("#dialogList").jqGrid({
		url: "/getUsernames",
		datatype: "json",
		mtype: "POST",
		height: 250,
		width: 500,
		colNames: ['id', 'username'],
		colModel: [
		           {name:'id',index:'id',editable:false,width:50},
		           {name:'username',index:'username',editable:false,width:90},
		           ],
		           rowNum: 15,
		           rowList:[15,30,60],
		           pager: '#pager',
		           sortname: 'id',
		           viewrecords: true,
		           multiselect: true,
		           caption: "Users"
	});
	dialogStep = "users";
}
function nextStep() {
	
	switch (dialogStep) {
	case "annotations":
		var s = $("#dialogList").jqGrid('getGridParam','selarrrow');
		if (!s.length) {
			return;
		}
		annotationsArr = s;
		usersStep();
		break;
	case "users":
		submitNewTasks();
	}
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
		url : "/hideReviewTasks",
		type: "POST",
		data: "tasks=" + ids,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			$("#list").trigger('reloadGrid');
		},
		error: function(data){
			error(ids[1]);
		}
	});
}
function submitNewTasks() {
	var s = $("#dialogList").jqGrid('getGridParam','selarrrow');
	if (!s.length) {
		return;
	}
	var usersArr = s;
	$.ajax({
		url : "/addReviewTasks",
		type: "POST",
		data: "annotations=" + annotationsArr + "&users=" + usersArr,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				a.location.href = data.redirect;
				return;
			}
			$("#list").trigger('reloadGrid');
			$('#addTasks').dialog("close"); 
		},

		error: function(data){
			error("Insertion failed");
		}
	});
}


