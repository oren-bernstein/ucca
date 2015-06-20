$(document).ready(function(){
	$("#list").jqGrid({
		datatype: "local",
		colNames: ['id','passage', 'project','user','prid', 'status'],
		colModel: [
		           {name:'id',index:'id',editable:false,width:30,sorttype:'int'},
		           {name:'passage',index:'passage',editable:true,edittype:"textarea",width:300},
		           {name:'project',index:'project',editable:true,width:100},
		           {name:'user',index:'user',editable:true,width:100},
		           {name:'prid',index:'prid',editable:true,width:100,hidden:true},
		           {name:'status',index:'status',editable:true,edittype:"select",editoptions: {value:"1:active;0:inactive"},width:80}
		           ],
		           pager: '#pager',
		           viewrecords: true,
		           caption: "My review tasks",
		           sortname: 'id',
		           height: 250,
		           rowNum: 15,
		           autowidth: true,
		           rowList: [15, 30, 60],
		           onSelectRow: function(id) {
		        	   var rtid = $("#list").jqGrid('getRowData',id).id;
		        		$.ajax({
		        			url : "/openUserReviewTask",
		        			type: "POST",
		        			data: "rtid=" + rtid,
		        			success: function(a){
		        				if (a.redirect) {
		        					// data.redirect contains the string URL to redirect to
		        					window.location.href = a.redirect;
		        					return;
		        				}
		        				if (a.message) {
		        					error(a.message);
		        				}
		        			},
		        			error: function(data){
		        				error("Failed");
		        			}
		        		});
		        	   
		           }
	});
	fillGrid();
});
function fillGrid(){
	$.ajax({
		url : "/getUserReviewTasks",
		type: "POST",
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
			var arr=$.parseJSON(a);
			for (var i=0; i<arr.length; i++) {
				$('#list').jqGrid('addRowData',i,arr[i]);
			};
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