var lastsel = -1;
var lastpid;
var currPid = -1;
$(document).ready(function(){
	$("#list").jqGrid({
		datatype: "local",
		colNames: ['pid','passage', 'source', 'user', 'status','project','annotations'],
		colModel: [
		           {name:'pid',key:true,index:'pid',editable:false,width:30,sorttype:'int'},
		           {name:'passage',index:'passage',editable:true,edittype:"textarea",width:300},
		           {name:'source',index:'source',editable:true,edittype:"textarea",width:100},
		           {name:'user',index:'user',editable:false,width:90},
		           {name:'status',index:'status',editable:true,edittype:"select",
		        	   editoptions: {value:"1:active;0:inactive,2:inreview"},width:80},
			           {name:'project',index:'project',editable:false,width:90},
		        	   {name:'annotations',index:'annotations',editable:false,
		        		   width:80,formatter: 'showlink',
		        		   formatoptions: {baseLinkUrl: '#p'}}
		        	   ],
		        	   pager: '#pager',
		        	   viewrecords: true,
		        	   multiselect: true,
		        	   caption: "Passages",
		        	   sortname: 'pid',
		        	   editurl: "/editPassage",
		        	   height: 250,
		        	   rowNum: 15,
		        	   autowidth: true,
		        	   rowList: [15, 30, 60],
		        	   onSelectRow: function(id) {
		        		   if (id && id != lastsel) {
		        			   $("#list").jqGrid('saveRow',lastsel,null,"/editPassage",{'pid':lastpid});
		        			   lastpid = $("#list").jqGrid('getRowData',id).pid;
		        			   $("#list").jqGrid('editRow',id,true,null,null,"/editPassage",{'pid':lastpid});
		        			   lastsel = id;
		        		   }
		        	   }
	});
	fillGrid();
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
	
});
function fillGrid(){
	$.ajax({
		url : "/getPassages",
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
			prepareLinks(1);
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

function insertPassage() {
	passage=$('#text').val();
	source=$('#source').val();
	gid=$('#uploadGroup').val();
	$('#text').val("");
	$.ajax({
		url : "/insertPassage",
		type: "POST",
		data: {text:  passage, source: source, gid: gid},
		dataType: "text",
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
				return;
			}
			$("#list").clearGridData(false);
			fillGrid();
		},
		error: function(data){
			error("Insertion failed");
		}
	});
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
			$("#list").clearGridData(false);
			fillGrid();
		},
		error: function(data){
			error("Deletion failed");
		}
	});
}

function prepareUserLinks() {
	prepareLinks(2);
}
function prepareUserAnnotationsLinks() {
	prepareLinks(3);
}
var LINKTYPES = {
		1: {id: 'passage', short: 'p', table: "#list", func: openPassageBox}, //help
		2: {id: 'user', short: 'u', table: "#passageList", func: openUserPassageBox}, //yes or no dialog
		3: {id: 'annotation', short: 'a', table: "#passageList", func: openByXid}
};
function prepareLinks(type) {
	var ids = $(LINKTYPES[type].table).getDataIDs();
	for (var i = 0, idCount = ids.length; i < idCount; i++) {
		$("#"+ids[i]+" a",$(LINKTYPES[type].table)[0]).click(function(e) {
			var hash=e.currentTarget.hash;// string like "#?id=0"
			if (hash.substring(0,6) === '#'+LINKTYPES[type].short+'?id=') {
				var id = hash.substring(6,hash.length);
				LINKTYPES[type].func(id);
			}
			e.preventDefault();
		});
	}
}

function openPassageBox(id) {
	currPid=id;
	$.ajax({
		url : "/getPassageUsers",
		data : "pid=" + id,
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
				$("#passageList").jqGrid({
					data: arr,
					datatype: "local",
					colNames: ['uid', 'username', 'project', 'annotations'],
					colModel: [
					           {name:'uid',key:true,index:'uid',editable:false,width:30,sorttype:'int'},
					           {name:'username',index:'username',editable:false,width:90},
					           {name:'project',index:'project',editable:false,width:90},
					           {name:'annotations',index:'annotations',editable:false,
					        	   width:80,formatter: 'showlink',
					        	   formatoptions: {baseLinkUrl: '#u'}}
					           ],
					           pager: '#pager',
					           viewrecords: true,
					           multiselect: true,
					           caption: "Users",
					           sortname: 'uid',
					           loadComplete: prepareUserLinks,
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

function openUserPassageBox(id) {
	$('#passageList').jqGrid('GridUnload');
	$.ajax({
		url : "/getPassageUserAnnotations",
		data : "pid=" + currPid + "&uid=" + id,
		type: "POST",
		success: function(a){
			if (a.redirect) {
				window.location.href = a.redirect;
			}
			else  {
				var arr=$.parseJSON(a);
				dialog = 7;
				$('#darken').fadeTo('fast', 0.4);
				$('#dialog').html();
				$('#dialog').fadeIn('fast',null);
				$("#passageList").jqGrid({
					data: arr,
					datatype: "local",
					colNames: ['xid', 'status', 'ts'],
					colModel: [
					           {name:'xid',key:true,index:'xid',editable:false,width:30,sorttype:'int'},
					           {name:'status',index:'status',editable:false,width:90},
					           {name:'ts',index:'ts',editable:false,
					        	   width:80,formatter: 'showlink',
					        	   formatoptions: {baseLinkUrl: '#a'}}
					           ],
					           pager: '#pager',
					           viewrecords: true,
					           multiselect: true,
					           caption: "Annotations",
					           sortname: 'xid',
					           loadComplete: prepareUserAnnotationsLinks,
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
function closeDialog() {
	$('#passageList').jqGrid('GridUnload');
	$("#darken").fadeOut('fast',null);
	$("#dialog").fadeOut('fast',null);
}
function openByXid(xid) {

	$.ajax({
		url : "/openByXid",
		type: "POST",
		data: "xid=" + xid,
		success: function(a){
			if (a.redirect) {
				// data.redirect contains the string URL to redirect to
				window.location.href = a.redirect;
				return;
			}
		},
		error: function(data){
			error("Failed");
		}
	});
}
