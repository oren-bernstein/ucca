$(document).ready(function(){
	$("#list").jqGrid({
		url: '/getUnfit',
		datatype: "json",
		mtype: "POST",
		height: 250,
		width:640,
		colNames: ['id', 'uid', 'username', 'pid', 'project', 'passage'],
		colModel: [
		           {name:'id',index:'id',editable:false},
		           {name:'uid',hidden:true,index:'uid',editable:false},
		           {name:'username',index:'username',editable:false},
		           {name:'pid',hidden:true,index:'pid',editable:false},
		           {name:'project',index:'project',editable:false},
		           {name:'passage',index:'passage',editable:false},
		           ],
		           rowNum: 15,
		           rowList:[15,30,60],
		           pager: '#pager',
		           sortname: 'id',
		           viewrecords: true,
		           multiselect: true,
		           caption: "Unfit passages"
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
		var ret = $("#list").jqGrid('getCell',s[i],'pid');
		ids.push(ret);
	}
	$.ajax({
		url : "/hidePassages",
		type: "POST",
		data: "passages=" + ids,
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