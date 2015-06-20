$(document).ready(function(){
	$("#list").jqGrid({
		url: '/getTasks',
		datatype: "json",
		mtype: "POST",
		height: 250,
            width: 500,
		colNames: ['id', 'username', 'uid', 'project', 'passage', 'status'],
		colModel: [
		           {name:'tid',index:'tid',editable:false,width:50},
		           {name:'username',index:'username',editable:false,width:90},
		           {name:'uid',hidden:true,index:'uid',editable:false},
		           {name:'project',index:'project',editable:false,width:50},
		           {name:'passage',index:'passage',editable:false,width:50},
		           {name:'status',index:'status',editable:false,width:50},
		           ],
		           rowNum: 15,
		           rowList:[15,30,60],
		           pager: '#pager',
		           sortname: 'tid',
		           viewrecords: true,
		           multiselect: true,
		           caption: "Tasks"
	});
	$('#addTasks').dialog({
		autoOpen: false,
		width: 600,
		buttons: {
			"Ok": function() { 
				addTasks();
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
	$("#uploadForm").ajaxForm();
	$.ajax({
		url : "/getProjectNames",
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
				option.setAttribute('value', arr[i].prid);
				option.appendChild(document.createTextNode(arr[i].name + " (" + arr[i].version + ")"));
				$("#formProjects").append(option);
			}
		},
		error: function(data){
			error("Failed");
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
	$.ajax({
		url : "/usersAndPassages",
		type: "POST",
		success: function(str){
                    var a = $.parseJSON(str);
		    if (a.redirect) {
			// data.redirect contains the string URL to redirect to
			a.location.href = data.redirect;
			return;
		    }

		    if (a.users && a.passages) {
		        formUsers = document.getElementById('formUsers');
		        formPassages = document.getElementById('formPassages');
		        while (formUsers.hasChildNodes()) {
		            formUsers.removeChild(formUsers.lastChild);
		        }
		        while (formPassages.hasChildNodes()) {
		            formPassages.removeChild(formPassages.lastChild);
		        }

		        for (var i in a.users) {
		            var li = document.createElement('li');
		            var o = document.createElement('input');
		            o.setAttribute('value', i);
		            o.setAttribute('type', 'checkbox');
		            li.appendChild(o);
		            li.appendChild(document.createTextNode(a.users[i]));
		            formUsers.appendChild(li);
		        }
                        
		        for (var i in a.passages) {
		            var li = document.createElement('li');
		            var o = document.createElement('input');
		            o.setAttribute('value', i);
		            o.setAttribute('type', 'checkbox');
		            li.appendChild(o);
		            li.appendChild(document.createTextNode(a.passages[i]));
		            formPassages.appendChild(li);
		        }
                        
		        $('#addTasks').dialog('open');
                    }
                    
                    /*
                    if (a.users && a.passages && a.projects) {
			formUsers = document.getElementById('formUsers');
			formPassages = document.getElementById('formPassages');
                        formProjects = document.getElementById('formProjects');
			while (formUsers.hasChildNodes()) {
			    formUsers.removeChild(formUsers.lastChild);
			}

			while (formPassages.hasChildNodes()) {
			    formPassages.removeChild(formPassages.lastChild);
			}

			while (formProjects.hasChildNodes()) {
			    formProjects.removeChild(formPassages.lastChild);
			}


			for (var i in a.users) {
			    var li = document.createElement('li');
			    var o = document.createElement('input');
			    o.setAttribute('value', i);
			    o.setAttribute('type', 'checkbox');
			    li.appendChild(o);
			    li.appendChild(document.createTextNode(a.users[i]));
			    formUsers.appendChild(li);
			}
                        

			for (var i in a.passages) {
			    var li = document.createElement('li');
			    var o = document.createElement('input');
			    o.setAttribute('value', i);
			    o.setAttribute('type', 'checkbox');
			    li.appendChild(o);
			    li.appendChild(document.createTextNode(a.passages[i]));
			    formPassages.appendChild(li);
			}


			for (var i in a.projects) {
			    var opt = document.createElement('option');
                            opt.setAttribute('value', i);
			    opt.appendChild(document.createTextNode(a.projects[i]));
			    formProjects.appendChild(opt);
			}

			$('#addTasks').dialog('open');
                        */
		    
		},
		error: function(data){
			error("Insertion failed");
		}
	});
}

function addTasks() {
    var passages = $('#formPassages :checked').map(function() {
        return $(this).val();
    }).get();

    var users = $('#formUsers :checked').map(function() {
	return $(this).val();
    }).get();

    var project = document.getElementById('formProjects').value;
    $.ajax({
	url : "/addTasks",
	type: "POST",
	data: "passages=" + passages + "&users=" + users + "&project=" + project,
	success: function(a){
	    if (a.redirect) {
		// data.redirect contains the string URL to redirect to
		a.location.href = data.redirect;
		return;
	    }
	    $("#list").trigger('reloadGrid');
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
		var ret = $("#list").jqGrid('getCell',s[i],'tid');
		ids.push(ret);
	}
	$.ajax({
		url : "/hideTasks",
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