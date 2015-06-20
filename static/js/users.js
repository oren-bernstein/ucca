var lastsel;
var lastuid;
$(document).ready(function(){
	$("#list").jqGrid({
		datatype: "local",
		height: 250,
		colNames: ['id','username', 'fullname', 'affiliation', 'email', 'active','permissions','tasks'],
		colModel: [
		           {name:'uid',index:'uid',editable:false,width:30},
		           {name:'username',index:'username',editable:false},
		           {name:'fullname',index:'fullname',editable:true},
		           {name:'affiliation',index:'affiliation',editable:true},
		           {name:'email',index:'email',editable:true},
		           {name:'active',index:'active',editable:true,edittype:"checkbox",editoptions: {value:"true:false"},width: 60},
		           {name:'permissions',index:'permissions',editable:true,width: 100}, //edittype:"checkbox",editoptions: {value:"true:false"}
		           {name:'tasks',index:'tasks',editable:false,formatter: 'showlink',formatoptions: {baseLinkUrl: '#u'},width: 50},
		           ],
		           pager: '#pager',
		           onSelectRow: function(id) {
		        	   if (id != lastsel) {
		        		   $("#list").jqGrid('saveRow',lastsel,null,"/editUser",{'uid':lastuid});
		        		   lastuid = $("#list").jqGrid('getRowData',id).uid;
		        		   $("#list").jqGrid('editRow',id,true,null,null,"/editUser",{'uid':lastuid});
		        		   lastsel = id;
		        	   }
		           },
		           viewrecords: true,
		           multiselect:true,
		           grouping:true,
		           groupingView : {
		        	   groupField : ['permissions']
		           },
		           editurl: "/editUser",
		           caption: "User list"
	});
	fillGrid();
});
function fillGrid() {
	$.ajax({
		url : "/getUsers",
		type: "POST",
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
			var arr=$.parseJSON(a);
			for (var i=0; i<arr.length; i++) {
				$('#list').jqGrid('addRowData',arr[i].uid,arr[i]);
			}
			prepareLinks();
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
function prepareLinks() {
	var ids = $("#list").getDataIDs();
	for (var i = 0, idCount = ids.length; i < idCount; i++) {
		$("#"+ids[i]+" a",$('#list')[0]).click(function(e) {
			var hash=e.currentTarget.hash;// string like "#?id=0"
			if (hash.substring(0,6) === '#u?id=') {
				var id = hash.substring(6,hash.length);
				openUserTaskBox(id);
			}
			e.preventDefault();
		});
	}
}
function closeDialog() {
	$('#passageList').jqGrid('GridUnload');
	$("#darken").fadeOut('fast',null);
	$("#dialog").fadeOut('fast',null);
}
function openUserTaskBox(id) {
	$.ajax({
		url : "/getAdminUserTasks",
		data : "uid=" + id,
		type: "POST",
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
			}
			else  {
				var arr=$.parseJSON(a);
				$('#darken').fadeTo('fast', 0.4);
				$('#dialog').html();
				$('#dialog').fadeIn('fast',null);
				$("#userTaskList").jqGrid({
					data: arr,
					datatype: "local",
					colNames: ['tid', 'pid', 'passage', 'project', 'status'],
					colModel: [
					           {name:'tid',key:true,index:'tid',editable:false,width:30,sorttype:'int'},
					           {name:'pid',index:'pid',editable:false,width:30,sorttype:'int'},
					           {name:'passage',index:'passage',editable:false,width:90},
					           {name:'project',index:'project',editable:false,width:80},
					           {name:'status',index:'status',editable:false,width:80}
					           ],
					           pager: '#pager',
					           viewrecords: true,
					           multiselect: true,
					           caption: "User tasks",
					           sortname: 'tid',
					           rowNum: 15,
					           autowidth: true,
					           rowList: [15, 30, 60],
					           onSelectRow: function(id) {
					        	   if (id && id != lastsel) {
					        	   }
					           }
				});
			}
		},
		error: function(data){
			error("failed");
			return -1;
		}
	});
	return 0;
}
function hideSelected() {
	var s = $("#list").jqGrid('getGridParam','selarrrow');
	if (!s.length) {
		return;
	}
	var ids = new Array();
	for (var i = 0; i < s.length; i++) {
		var ret = $("#list").jqGrid('getCell',s[i],'uid');
		ids.push(ret);
	}
	$.ajax({
		url : "/hideUsers",
		type: "POST",
		data: "users=" + ids,
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