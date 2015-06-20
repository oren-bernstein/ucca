$(document).ready(function(){
	$("#list").jqGrid({
		url: '/getComments',
		datatype: "json",
		mtype: "POST",
		height: 250,
		width:640,
		colNames: ['username', 'passage', 'project', 'comment'],
		colModel: [
		           {name:'username',index:'username',editable:false},
		           {name:'passage',index:'passage',editable:false},
		           {name:'project',index:'project',editable:false},
		           {name:'comment',index:'comment',editable:false},
		           ],
		           rowNum: 15,
		           rowList:[15,30,60],
		           pager: '#pager',
		           sortname: 'id',
		           viewrecords: true,
		           multiselect: true,
		           caption: "Comments"
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