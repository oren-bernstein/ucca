import json
import datetime, time, subprocess
import sys
import os, traceback
from bottle import route, run, error, request, static_file, debug, redirect, app, template, abort, response
from beaker.middleware import SessionMiddleware
import smtplib
from email.mime.text import MIMEText
import psycopg2
import subprocess
import pdb


######################
# Global Variables
######################

con = psycopg2.connect(host="localhost", database="work",user="oren",password="Password1")
cur = con.cursor()
cur.execute("SET search_path TO public")
con.set_client_encoding('UTF8')
con.commit()
DOC_DELIMITER = "<--"
HELP_DOC_FILE = "DOCS_FILE"
DEFAULT_PROJECT = "default"
#sys.setdefaultencoding('utf_8')
XML_INPUT_FILE = 'XML_INPUT'
XML_OUTPUT_FILE = 'XML_OUTPUT'

######################
# Methods
######################

def logged(session):
    print(session)
    if "loggedIn" in session:
        if session["loggedIn"] == 1:
            if "userId" in session:
                uid = session["userId"]
                try:
                    cur.execute("SELECT status FROM users WHERE id=%s AND displayed=1", (uid,))
                except Exception, e:
                    print(e.pgerror)
                    return False
                result = cur.fetchone()
                return result[0] == 1
    return False

def admin(session):
    if not logged(session):
        return False
    if "userId" in session:
        uid = session["userId"]
    else:
        return False
    try:
        cur.execute("SELECT permissions FROM users WHERE id=%s", (uid,))
    except Exception, e:
        print(e.pgerror)
        return False
    result = cur.fetchone()
    return result[0] == 1

def guest(session):
    if not logged(session):
        return False
    if "userId" in session:
        uid = session["userId"]
    else:
        return False
    try:
        cur.execute("SELECT permissions FROM users WHERE id=%s", (uid,))
    except Exception, e:
        print(e.pgerror)
        return False
    result = cur.fetchone()
    return result[0] == 2

@route('/submitRegistration', method='POST')
def register():
    user = request.forms.get('user')
    try:
        cur.execute("SELECT * FROM users WHERE username=%s", (user,))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    if (len(result) != 0):
        return {'error': 'Username already exists'}
    password = request.forms.get('pass')
    email = request.forms.get('email')
    affiliation = request.forms.get('affil')
    fullname = request.forms.get('fullname')
    try:
        cur.execute("INSERT INTO users (username, password, email, fullname, affiliation, status, permissions, settings, displayed) VALUES (%s, %s, %s, %s, %s, 1, 2,'small;small',1)", (user, password, email,fullname,affiliation))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    try:
        cur.execute("SELECT * FROM users WHERE username=%s", (user,))
    except Exception, e:
        print(e.pgerror)
        pdb.set_trace()
        return {'error': e.pgerror}
    result = cur.fetchone()
    s = request.environ.get('beaker.session')
    s['userId'] = result[0]
    s['loggedIn'] = 1
    msg = MIMEText('Dear '+fullname+',\n\nWelcome to UCCA.\nYour username is: '+user+' and your password is: '+password+'.\nPlease feel free to contact me with any questions.\n\nOmri Abend\nOn behalf of the UCCA team')
    msg['Subject'] = 'Welcome to UCCA'
    msg['From'] = 'omria01@cs.huji.ac.il'
    msg['To'] = email
    s = smtplib.SMTP('mailhost.cs.huji.ac.il')
    s.sendmail('tom@fdf.om',[email], msg.as_string())
    s.quit()
    return {'redirect': '/'}

@route('/submitXML', method='POST')
def submitXML():
    xml = request.forms.get('user')
    

@route('/submitLogin', method='POST')
def login():
    user = request.forms.get('user')
    password = request.forms.get('pass')
    try:
        cur.execute("SELECT * FROM users WHERE username=%s AND password=%s AND status=1 AND displayed=1", (user,password))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchone()
    if (result == None):
        return {'error': 'Bad username or password'}
    s = request.environ.get('beaker.session')
    s['userId'] = result[0]
    s['loggedIn'] = 1
    return {'redirect': '/'}

@route('/', method='GET')
def home():
    return static_file('home.html', root='../../static/')

@route('/homeLinks', method='POST')
def homeLinks():
    s = request.environ.get('beaker.session')
    curUsername = ""
    if not logged(s):
        links = {'login': 'Login (if not registered, use username:"guest", password:"tseug")','register': 'Register'}
        order = {'login': '1', 'register': '2'}
        status = 0
    else:
        uid = s['userId']
        try:
            cur.execute("SELECT username FROM users WHERE id=%s", (uid,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
        result = cur.fetchone()
        curUsername = result[0]
        
        if admin(s):
            links = {'projects': 'Manage Projects', 'annotate': 'Annotate','users': 'Manage Users','tasks': 'Manage Tasks','passages': 'Manage Passages','comments': 'View comments','sam':'Single Annotator Mode','unfit': 'Manage Reports of Unfit Passages','logout': 'Logout', 'review': 'Review Annotations', 'reviewTasks': 'Manage Annotation Review Tasks'}
            order = {'annotate': '-2', 'projects' : '1' ,'users': '2','tasks': '3','passages': '4','comments': '5','sam':'9','unfit': '5','logout': '-1', 'review': '-1.5', 'reviewTasks': '11'}
            status = 1
        elif guest(s):
            links = {'sam': 'Single Annotator Mode', 'reference1': 'Worked-out Example #1', 'reference2': 'Worked-out Example #2', 'reference3': 'Worked-out Example #3', 'reference4': 'Worked-out Example #4', 'annotate': 'Annotate', 'logout': 'Logout'}
            order = {'reference1' : '1', 'reference2' : '2', 'reference3' : '3', 'reference4' : '4', 'annotate': '-2', 'logout': '5', 'sam': '-3'}
            status = 3
        else:
            links = {'annotate': 'Annotate', 'logout': 'Logout', 'review': 'Review Annotations'}
            order = {'annotate': '-2', 'logout': '-1', 'review': '-1.5'}
            status = 2
    return {'links': links, 'order': order, 'username': curUsername, 'status': status}

@route('/getUsers', method='POST')
def users():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    try:
        cur.execute("SELECT u.id, u.username, u.fullname, u.affiliation, u.email, u.status, u.permissions FROM users u WHERE u.displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps([dict(uid=x[0], username=x[1], fullname=x[2], affiliation=x[3], email=x[4],
                            active="true" if x[5] == 1 else "false",
                            permissions="admin" if x[6] == 1 else ("guest" if x[6] == 2 else "annotator"),
                            tasks="tasks") for x in result])
    
@route('/getUsernames', method='POST')
def usernames():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM users u WHERE u.displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = max(0,limit * page - limit)
    try:
        
        cur.execute("SELECT id, username FROM users WHERE displayed=1 ORDER BY %s %s LIMIT %s OFFSET %s" % (sidx, sord, limit, start))
    except Exception as e:
        print("An error occurred:", e.args[0])
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, \
                       'rows': [{'id': t[0], 'cell': [t[0], t[1]]} for t in result]})

@route('/getReviewTasks', method='POST')
def getReviewTasks():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM users u, passages p, projects pr, reviewTasks rt, xmls x WHERE rt.uid=u.id AND rt.xid=x.id AND x.prid=pr.id AND x.paid=p.id AND rt.displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = max(0,limit * page - limit)
    query = "SELECT rt.id AS id, u.username AS username, u.id AS uid, pr.name AS name, p.id AS pid, p.passage AS passage, rt.status AS status FROM users u, passages p, projects pr, reviewTasks rt, xmls x WHERE rt.uid=u.id AND rt.xid=x.id AND x.prid=pr.id AND x.paid=p.id AND rt.displayed=1 ORDER BY %s %s LIMIT %s OFFSET %s" % (sidx, sord, limit, start)
    try:
        cur.execute(query)
    except Exception as e:
        print("An error occurred:", e.args[0])
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, \
                       'rows': [{'id': t[0], 'cell': [t[0], t[1], t[2], t[3], t[4], t[5], "complete" if t[6] == 1 else ("incomplete" if t[6] == 0 else "not started")]} for t in result]})

@route('/getTasks', method='POST')
def tasks():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM tasks t, users u WHERE u.id=t.uid AND t.displayed=1 AND u.displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = max(0,limit * page - limit)
    query = "SELECT t.id AS tid, u.username, u.id AS uid, pr.name AS project, t.pid AS pid, t.status AS status FROM tasks t, users u, passages p, projects pr WHERE pr.id=t.prid AND u.id=t.uid AND t.pid=p.id AND t.displayed=1 AND p.displayed=1 ORDER BY %s %s LIMIT %s OFFSET %s" % (sidx, sord, limit, start)
    try:
        cur.execute(query)
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, \
                       'rows': [{'id': t[0], 'cell': [t[0], t[1], t[2], t[3], t[4], "not started" if t[5] == -1 else ("incomplete" if t[5] == 0 else "submitted")]} for t in result]}, \
                      ensure_ascii=False)

@route('/getProjects', method='POST')
def projects():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM projects WHERE displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = max(0,limit * page - limit)
    query = "SELECT * FROM projects WHERE displayed=1 ORDER BY %s %s LIMIT %s OFFSET %s" % (sidx, sord, limit, start)
    try:
        cur.execute(query)
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, \
                       'rows': [{'id': t[0], 'cell': [t[0], t[1], t[2], t[3]]} for t in result]})

@route('/getUnfit', method='POST')
def getUnfit():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM unfit un, users us, passages p WHERE un.uid=us.id AND p.id = un.paid AND p.displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = limit * page - limit
    try:
        cur.execute("SELECT un.id AS id, un.uid AS uid, us.username AS username, un.paid as paid, pr.name as project, p.passage as passage FROM projects pr, unfit un, users us, passages p WHERE pr.id=un.prid AND un.uid=us.id AND p.id = un.paid AND p.displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, 'rows': [{'id': t[0], 'cell': [t[0], t[1], t[2], t[3], t[4], t[5]]} for t in result]})
    
@route('/hideTasks', method='POST')
def hideTasks():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('tasks') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE tasks SET displayed=0 WHERE id=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return
    
@route('/hideReviewTasks', method='POST')
def hideReviewTasks():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('tasks') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE reviewTasks SET displayed=0 WHERE id=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return

@route('/hideProjects', method='POST')
def hideProjects():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('projects') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE projects SET displayed=0 WHERE id=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return

@route('/getPassages', method='POST')
def passages():
    #try:
    #    response.content_type = 'text/html; charset=latin9'
    #except e:
    #    print "An error occurred:", e
    
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    try:
        cur.execute("SELECT p.id, p.passage, p.source, u.username, p.status, pr.name FROM users u, passages p, projects pr, projectPassages pp WHERE u.id=p.uid AND p.displayed=1 AND pp.prid=pr.id ORDER BY p.id")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    try:
        return json.dumps([dict(pid=x[0], passage=x[1], source=x[2], user=x[3], \
                                status="active" if x[4] == 1 else "not reviewed" if x[4] == 2 else "inactive", project=x[5], annotations="Annotations") for x in result], \
                          ensure_ascii=False)
    except Exception as e:
        print("An error occurred:", e.args[0])



@route('/annotationsForReview', method='POST')
def annotationsForReview():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM users u, passages p, projects pr, xmls x, tasks t WHERE x.ts=(SELECT MAX(x2.ts) FROM xmls x2 WHERE x2.uid=u.id AND x2.prid=pr.id AND x2.paid=p.id) AND u.id=x.uid AND x.prid=pr.id AND p.id=x.paid AND p.displayed=1 AND t.status=1 AND t.uid=u.id AND pr.id=t.prid AND t.pid=p.id")
    except Exception as e:
        print("An error occurred:", e.args[0])
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = max(0,limit * page - limit)
    query = "SELECT x.id, u.username, p.passage, pr.name FROM tasks t, users u, passages p, projects pr, xmls x WHERE x.ts=(SELECT MAX(x2.ts) FROM xmls x2 WHERE x2.uid=u.id AND x2.prid=pr.id AND x2.paid=p.id) AND u.id=x.uid AND x.prid=pr.id AND p.id=x.paid AND p.displayed=1 AND t.status=1 AND t.uid=u.id AND pr.id=t.prid AND t.pid=p.id ORDER BY x.id %s LIMIT %s OFFSET %s" % (sord, limit, start)
    try:
        
        cur.execute(query)
    except Exception, e:
        print("An error occurred:", e.args[0])
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, 'rows': [{'id': t[0], 'cell': [t[1], t[2] if len(t[2]) < 41 else t[2][:40] + "...", t[3]]} for t in result]})

@route('/getComments', method='POST')
def comments():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    page = int(request.forms.get('page'))
    limit = int(request.forms.get('rows'))
    sidx = request.forms.get('sidx')
    sord = request.forms.get('sord')
    try:
        cur.execute("SELECT COUNT(*) FROM users u, passages p, projects pr, xmls x WHERE x.ts=(SELECT MAX(x2.ts) FROM xmls x2 WHERE x2.uid=u.id AND x2.prid=pr.id AND x2.paid=p.id) AND u.id=x.uid AND x.prid=pr.id AND p.id=x.paid AND p.displayed=1")# AND NOT trim(x.comment) = ''")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    recordCount = result[0][0]
    if recordCount > 0:
        totalPages = recordCount / limit
    else:
        totalPages = 0
    if page > totalPages:
        page = totalPages
    start = max(0,limit * page - limit)
    query = "SELECT x.id, u.username, p.passage, pr.name, x.comment FROM users u, passages p, projects pr, xmls x WHERE x.ts=(SELECT MAX(x2.ts) FROM xmls x2 WHERE x2.uid=u.id AND x2.prid=pr.id AND x2.paid=p.id) AND u.id=x.uid AND x.prid=pr.id AND p.id=x.paid AND p.displayed=1 AND NOT trim(x.comment) = '' ORDER BY x.id %s LIMIT %s OFFSET %s" % (sord, limit, start)
    try:
        cur.execute(query)
    except Exception, e:
        print("An error occurred:", e.args[0])
    result = cur.fetchall()
    return json.dumps({'total': totalPages, 'page': page, 'records': recordCount, 'rows': [{'id': t[0], 'cell': [t[1], t[2] if len(t[2]) < 41 else t[2][:40] + "...", t[3], t[4]]} for t in result]})


@route('/getGroups', method='POST')
def groups():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    try:
        cur.execute("SELECT id, name FROM groups WHERE status=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps([dict(gid=x[0], name=x[1]) for x in result])

@route('/getProjectNames', method='POST')
def projectNames():
    s = request.environ.get('beaker.session')
    if guest(s): # there is only one project a guest may add passages to
        try:
            cur.execute("SELECT id, name, version FROM projects WHERE id=-1")
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    elif not admin(s):
        return {'redirect': 'home'}
    else:
        try:
            cur.execute("SELECT id, name, version FROM projects WHERE displayed=1")
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps([dict(prid=x[0], name=x[1], version=x[2]) for x in result])

@route('/getConfigFilenames', method='POST')
def configFilenames():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    f=os.listdir('configs')
    return {'filenames':f}
    

@route('/getPassageUsers', method='POST')
def passageUsers():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    pid = request.forms.get('pid')
    try:
        cur.execute("SELECT DISTINCT u.id, u.username, pr.name FROM users u, xmls x, projects pr WHERE x.uid=u.id AND x.paid=%s AND x.prid=pr.id AND u.displayed=1", (pid,))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps([dict(uid=x[0], username=x[1], project=x[2], annotations="Annotations") for x in result])

@route('/getAdminUserTasks', method='POST')
def getAdminUserTasks():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    uid = request.forms.get('uid')
    try:
        cur.execute("SELECT t.id, pa.id, pa.passage, t.status, pr.name FROM tasks t, passages pa, projects pr WHERE t.prid=pr.id AND t.uid=%s AND pa.id=t.pid", (uid,))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps([dict(tid=x[0], pid=x[1], passage=x[2], status="not started" if x[3] == -1 else ("incomplete" if x[3] == 0 else "submitted"), project=x[4]) for x in result])

@route('/getPassageUserAnnotations', method='POST')
def passageUserAnnotations():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    pid = request.forms.get('pid')
    uid = request.forms.get('uid')
    print(uid)
    try:
        cur.execute("SELECT x.id, x.status, x.ts FROM xmls x WHERE x.uid=%s AND x.paid=%s", (uid,pid,))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return json.dumps([dict(xid=x[0], status=x[1], ts=str(x[2])) for x in result])

@route('/getUserTasks', method='POST')
def userTasks():
    #response.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    if not logged(s):
        return {'redirect': 'home'}
    try:
        cur.execute("SELECT p.id, p.passage, pr.name, t.prid, t.status, p.status FROM tasks t, passages p, projects pr WHERE t.pid=p.id AND t.uid=%s AND p.displayed=1 AND t.displayed=1 AND pr.id=t.prid AND (p.status>0 OR (p.status=-1 AND p.rid=%s)) ORDER BY p.id", (s['userId'],s['userId']))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    print(result)
    return json.dumps([dict(pid=x[0], passage=x[1] if len(x[1]) < 41 else x[1][:40] + "...", \
                            project=x[2], prid=x[3], status="complete" if x[4] == 1 else ("pending review" if x[5] == 2 else "incomplete")) for x in result],ensure_ascii=False)

@route('/getUserReviewTasks', method='POST')
def userReviewTasks():
    s = request.environ.get('beaker.session')
    if not logged(s):
        return {'redirect': 'home'}
    #'id','passage', 'project','user','prid', 'status'
    try:
#        cur.execute("SELECT rt.id, p.passage, pr.name, u.username, pr.id, rt.status FROM xmls x, users u, reviewTasks rt, passages p, projects pr WHERE rt.xid=x.id AND rt.uid=%s AND x.uid=u.id AND p.id=x.paid AND p.displayed=1 AND rt.displayed=1 AND pr.id=x.prid AND p.status>0", (s['userId'],))
        cur.execute("SELECT rt.id, p.passage, pr.name, u.username, pr.id, rt.status FROM xmls x, users u, reviewTasks rt, passages p, projects pr WHERE rt.xid=x.id AND rt.uid=%s AND x.uid=u.id AND p.id=x.paid AND p.displayed=1 AND pr.id=x.prid AND rt.displayed=1", (s['userId'],))
    except Exception, e:
        print("An error occurred:", e.args[0])
    result = cur.fetchall()
    print(result)
    return json.dumps([dict(id=x[0], passage=x[1] if len(x[1]) < 41 else x[1][:40] + "...", \
                            project=x[2], user=x[3], prid=x[4], status="completed" if x[5] == 1 else "incomplete") for x in result])

@route('/usersAndPassages', method='POST')
def usersAndPassages():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    try:
        cur.execute("SELECT id, username FROM users WHERE status=1 AND displayed=1")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    users = cur.fetchall()
    try:
        cur.execute("SELECT id, passage FROM passages WHERE displayed=1 AND status>0") 
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    passages = cur.fetchall()

    try:
        cur.execute("SELECT id, name FROM projects")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
            
    projects = cur.fetchall()
    return json.dumps({'users': dict([(u[0], u[1]) for u in users]), 'passages': dict([(p[0], p[1] if len(p[1]) < 41 else p[1][:40] + "...") for p in passages]),
            'projects': dict([(p[0], p[1]) for p in projects])}, ensure_ascii=False)

@route('/addTasks', method='POST')
def addTasks():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    passages = json.loads('[' + request.forms.get('passages') + ']')
    users = json.loads('[' + request.forms.get('users') + ']')
    project = request.forms.get('project')
    print("project:" + project)
    for p in passages:
        for u in users:
            try:
                cur.execute("INSERT INTO tasks (uid, pid, prid, status, displayed) VALUES (%s, %s, %s, -1, 1)", (u, p, project))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
    con.commit()
    return

@route('/addReviewTasks', method='POST')
def addReviewTasks():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    annotations = json.loads('[' + request.forms.get('annotations') + ']')
    users = json.loads('[' + request.forms.get('users') + ']')
    try:
        for a in annotations:
            for u in users:
                cur.execute("INSERT INTO reviewTasks (uid, xid, status, displayed) VALUES (%s, %s, -1, 1)", (u, a))
    except Exception, e:
        print("An error occurred:", e.args[0])
    con.commit()
    return

@route('/uploadTasksFile', method='POST')
def uploadTasksFile():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    uid=s['userId']
    data = request.files.get('file')
    curProject = None  #the associated project must be specified in the first line of the file, between '<' and '>'
    if data.file:
        last = ""
        while True:
            chunk = data.file.read(1024*100)
            if not chunk:
                break
            l = chunk.split('\n');
            l[0] = last + l[0]
            i = 0
            if (l[0].strip().startswith('<') and l[0].strip().endswith('>')):
                curProject = l[0].strip()
                curProject = curProject[1:-1]
                i = 1
            elif project == None:
                return {'msg': 'No project name specified'}
                
            while i <= len(l) - 1:
                if l[i] == "":
                    i += 1
                    continue
                task = l[i].split(' ')
                print('1',int(task[0]), int(task[1].strip('\r')), int(curProject))
                try:
                    cur.execute("INSERT INTO tasks (uid, pid, prid, status, displayed) VALUES (%s, %s, %s, -1, 1)", (int(task[0]), int(task[1].strip('\r')), int(curProject)))
                except Exception, e:
                    print(e.pgerror)
                    return {'error': e.pgerror}
                i += 1
            last = l[len(l) - 1]
        task = last.split(' ')
        if len(task) == 2:
            print('2',task[0],task[1].strip('\r'), curProject)
            try:
                cur.execute("INSERT INTO tasks (uid, pid, prid, status, displayed) VALUES (%s, %s, %s, -1, 1)", (int(task[0]),int(task[1].strip('\r')), int(curProject)))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
        con.commit()
    return

@route('/uploadReviewTasksFile', method='POST')
def uploadReviewTasksFile():
    """
    Uploads a file of review tasks. each task should be in a separate line which has two numbers, one is the user id which is
    to review the passage. xid is the xid of the annotation to be reviewed.
    """    
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    uid=s['userId']
    data = request.files.get('file')

    if data.file:
        last = ""
        while True:
            chunk = data.file.read(1024*100)
            if not chunk:
                break
            l = chunk.split('\n');
            l[0] = last + l[0]
            i = 0
            while i <= len(l) - 1:
                if l[i] == "":
                    i += 1
                    continue
                task = l[i].split(' ')
                try:
                    print('x')
                    cur.execute("INSERT INTO reviewTasks (uid, xid, status, displayed) VALUES (%s, %s, -1, 1)", (int(task[0]), int(task[1])))
                except Exception, e:
                    print(e.pgerror)
                    return {'error': e.pgerror}
                i += 1
            last = l[len(l) - 1]
        task = last.split(' ')
        if len(task) == 2:
            try:
                print('x')
                cur.execute("INSERT INTO reviewTasks (uid, xid, status, displayed) VALUES (%s, %s, -1, 1)", (int(task[0]), int(task[1].strip('\r'))))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
        con.commit()

@route('/editUser', method='POST')
def editUser():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    permissions_val = request.forms.get('permissions')
    print(permissions_val)
    newdata = (request.forms.get('fullname'),
               request.forms.get('affiliation'),
               request.forms.get('email'),
               1 if request.forms.get('active') == 'true' else 0,
               1 if permissions_val == 'admin' else (2 if permissions_val == 'guest' else 0),
               int(request.forms.get('uid')))
    try:
        cur.execute("UPDATE users SET fullname=%s, affiliation=%s, email=%s, status=%s, permissions=%s WHERE id=%s", newdata)
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return

@route('/editPassage', method='POST')
def editPassage():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    newdata = (request.forms.get('passage'), request.forms.get('source'), \
           request.forms.get('status'), request.forms.get('pid'))
    try:
        cur.execute("UPDATE passages SET passage=%s, source=%s, status=%s WHERE id=%s", newdata)
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return

@route('/insertPassage', method='POST')
def insertPassage():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    if not admin(s) and not guest(s):
        return {'redirect': 'home'}
    sam = (request.forms.get('sam') == "true")
    #format = request.forms.get('format')
    rid = -1
    status = 2

    #format_var = request.forms.get('format')
    #if format_var == 'rtl':
    #    direc = 0
    #else:
    #    direc = 1
    if sam:
        gid = 1
        if guest(s):
            status = 3  #i.e., to text parse it without giving it a 'pending review' status
        else:
            status = -1
        rid = s['userId']
    else:
        gid = request.forms.get('gid')
    newdata = (request.forms.get('text'),request.forms.get('source'),s['userId'],status,gid,rid)
    try:
        #if format != 'xml':
            #print(5)
            cur.execute("INSERT INTO passages (passage, source, uid, status, displayed, gid, rid) VALUES (%s, %s, %s, %s, 1, %s,%s) RETURNING id", newdata)
    except Exception, e:
        print("An error ocurred:", e.args[0])
        raise Exception("Insertion failed")
        
    if sam:
        prid = request.forms.get('prid')
        if format != 'xml':
            pid = cur.fetchone()[0]
        else:
            pid = -1 #insert passage here.
            try:
                site_xml = convert_standard_to_site_xml(request.forms.get('text'))
                if site_xml != None:
                    cur.execute("INSERT INTO xmls (reviewOf, xml, paid, prid, uid, comment, status, ts) VALUES (%s, %s, %s, %s, %s, %s, 0, %s)", (-1, site_xml, pid, prid, s['userId'], '', now))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
        try:
            cur.execute("INSERT INTO tasks (uid, pid, prid, status, displayed) VALUES (%s, %s, %s, -1, 1)", (s['userId'], pid, prid))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
        s['pid'] = pid
        s['prid'] = prid
        con.commit()
        return {'redirect': '/text'}
    con.commit()
    return
    
@route('/addProject', method='POST')
def addProject():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    name = request.forms.get('name')
    version = request.forms.get('version')
    config = request.forms.get('config')
    try:
        cur.execute("SELECT configFile, version FROM projects WHERE configFile=%s OR version=%s", (config,version))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    if (len(result) > 0):
        if (result[0][1] != version):
            return {'error': 'Change version to ' + result[0][1] + '.'}
        elif (result[0][0] != config):
            return {'error': 'Change config file to ' + result[0][0] + '.'}
    newdata = (name,version,config)
    try:
        cur.execute("INSERT INTO projects (name, version, configFile, displayed) VALUES (%s, %s, %s, 1)", newdata)
    except Exception, e:
        print("An error ocurred:", e.args[0])
        raise Exception("Insertion failed")
    con.commit()
    return "success"
    
@route('/hidePassages', method='POST')
def hidePassages():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('passages') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE passages SET displayed=0 WHERE id=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return
    
@route('/hideUsers', method='POST')
def hideUsers():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('users') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE users SET displayed=0 WHERE id=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return

@route('/uploadPassagesFile', method='POST')
def uploadPassagesFile():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    uid=s['userId']
    data = request.files.get('file')
    source = request.forms.get('source')
    gid = request.forms.get('group')
    if data.file:
        last = ""
        while True:
            chunk = data.file.read(1024*100)
            l = chunk.split('##');
            if not chunk:
                break
            l[0] = last + l[0]
            for i in range(len(l) - 1):
                if l[i].strip('\n\r ') != "":
                    try:
                        cur.execute("INSERT INTO passages (passage, source, uid, status, displayed, gid, rid) VALUES (%s, %s, %s, 2, 1, %s, -1)", (l[i].strip('\n\r '),source,uid,gid))
                    except Exception, e:
                        print(e.pgerror)
                        return {'error': e.pgerror}
            last = l[len(l) - 1]
        if last.strip('\n\r ') != "":
            try:
                cur.execute("INSERT INTO passages (passage, source, uid, status, displayed, gid, rid) VALUES (%s, %s, %s, 2, 1, %s, -1)", (last.strip('\n\r '),source,uid,gid))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
        con.commit()
    return {}

@route('/logout', method='GET')
def logout():
    s = request.environ.get('beaker.session')
    s.invalidate()
    redirect('/')

@route('/allAnnots')
def huca():
    try:
        cur.execute("SELECT * FROM xmls")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    string = str(result)
    try:
        cur.execute("SELECT * FROM users")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    return string+"<br>"+str(result)

@route('/save', method='POST')
def save():
    print(0)
    #request.content_type = 'text/html; charset=latin9'
    print(0.1)
    s = request.environ.get('beaker.session')
    print(0.2)    
    try:
        uid = s['userId']
    except:
        uid = 2
    xml = request.forms.get('xml')
    print(0.3)
    auto = request.forms.get('autosave')
    print(0.4)
    rtid = request.forms.get('rtid')
    reviewOf = -1
    if rtid != None:
        rtid = int(rtid)
    else:
        rtid = -1

    if (rtid != -1):
        try:
            print(2)
            cur.execute("SELECT x.paid, x.prid, x.id FROM xmls x, reviewTasks rt WHERE x.id=rt.xid AND rt.id=%s",(rtid,))
            print(3)
        except Exception, e:
            print(e.args[0])
        result = cur.fetchone()
        print(result)
        pid = result[0]
        prid = result[1]
        reviewOf = int(result[2])
    else:
        print(4)
        pid = int(request.forms.get('pid'))
        try:
            print(5)
            prid = s['prid']
        except:
            prid = 4
    print(6)
    comment = request.forms.get('comment')
    print(7)
    now = datetime.datetime.now()
    print(8)
    try:
        if auto == "true":
            try:
                print('x1')
                cur.execute("INSERT INTO autosave (xml, paid, prid, uid, comment, status, ts) VALUES (%s, %s, %s, %s, %s, 0, %s)", (xml, pid, prid, uid, comment, now))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
        else:
            #print(xml, reviewOf, pid, prid, uid, comment, now)
            try:
                print('x2')
                cur.execute("INSERT INTO xmls (reviewOf, xml, paid, prid, uid, comment, status, ts) VALUES (%s, %s, %s, %s, %s, %s, 0, %s)", (reviewOf, xml, pid, prid, uid, comment, now))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
            try:
                print('x3')
                cur.execute("SELECT MAX(id) FROM xmls")
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
            print('Saved. XID='+str(cur.fetchone()))
            if reviewOf < 0:
                try:
                    print('x4')
                    cur.execute("UPDATE tasks SET status=0 WHERE uid=%s AND pid=%s", (uid, pid))
                except Exception, e:
                    print(e.pgerror)
                    return {'error': e.pgerror}
            else:
                try:
                    print('x5')
                    cur.execute("UPDATE reviewTasks SET status=0 WHERE uid=%s AND xid=%s", (uid, reviewOf))
                except Exception, e:
                    print(e.pgerror)
                    return {'error': e.pgerror}
    except Exception, e:
        print(e.args[0])
        raise e
    con.commit()
    return "Saved."

@route('/updatePassage', method='POST')
def updatePassage():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    new_passage = request.forms.get('passage')
    pid = request.forms.get('pid')
    # passage status = 2 means that we should not apply a text parser on it. it is already parsed.
    print(new_passage)
    try:
        cur.execute("UPDATE passages SET passage=%s, status=1 WHERE id=%s", (new_passage, pid))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return{'redirect': '/text'}

@route('/cancelReview', method='POST')
def cancelReview():
    request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    new_passage = request.forms.get('passage')
    pid = request.forms.get('pid')
    try:
        cur.execute("UPDATE passages SET passage=%s, status=2, rid=-1 WHERE id=%s", (new_passage, pid)) 
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return {'redirect':'/'}

@route('/saveSettings', method='POST')
def saveSettings():
    s = request.environ.get('beaker.session')
    if not logged(s):
        return {'redirect': 'home'}
    uid = s['userId']
    settings = request.forms.get('settings')
    try:
        cur.execute("UPDATE users SET settings=%s WHERE id=%s", (settings,uid))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return "Saved."

@route('/submit', method='POST')
def submit():
    #request.content_type = 'text/html; charset=latin9'
    s = request.environ.get('beaker.session')
    uid = s['userId']
    xml = request.forms.get('xml')
    rtid = request.forms.get('rtid')
    ### BUG FIX
    if rtid == None:
        rtid = -1
    else:
        rtid = int(rtid)
        
    reviewOf = -1
    if (rtid < 0):
        pid = int(request.forms.get('pid'))
        if 'prid' in s:
            prid = s['prid']
        else:
            prid = 8
    else:
        try:
            cur.execute("SELECT x.paid, x.prid, x.id FROM xmls x, reviewTasks rt WHERE rt.xid=x.id AND rt.id=%s",(rtid,))
        except Exception, e:
            print("An error occurred:", e.args[0])
            return
        result = cur.fetchone()
        print('res:', result)
        pid = result[0]
        prid = result[1]
        reviewOf = result[2]
    comment = request.forms.get('comment')
    now = datetime.datetime.now()
    try:
        newData = (reviewOf, xml, pid, prid, uid, comment, now)
        print('x2')
        cur.execute("INSERT INTO xmls (reviewOf, xml, paid, prid, uid, comment, status, ts) VALUES (%s, %s, %s, %s, %s, %s, 1, %s)", newData)
        if reviewOf < 0:
            print('x3')
            cur.execute("UPDATE tasks SET status=1 WHERE uid=%s AND pid=%s", (uid, pid))
        else:
            print('x4')
            cur.execute("UPDATE reviewTasks SET status=1 WHERE uid=%s AND xid=%s", (uid, reviewOf))
    except Exception, e:
        print("An error occurred:", e.args[0])
        return
    con.commit()
    return {'redirect':('/annotate' if reviewOf < 0 else 'review'), 'msg': 'Submitted.' }

@route('/submitReview', method='POST')
def submitReview():
    s = request.environ.get('beaker.session')
    uid = s['userId']
    xml = request.forms.get('xml')
    reviewOf = int(request.forms.get('reviewOf'))
    comment = request.forms.get('comment')
    now = datetime.datetime.now()
    try:
        cur.execute("INSERT INTO xmls (reviewOf, xml, paid, prid, uid, comment, status, ts) VALUES (%s, %s, %s, %s, %s, %s, 1, %s)", (xml, reviewOf, pid, prid, uid, comment, now))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    try:
        cur.execute("UPDATE tasks SET status=1 WHERE uid=%s AND pid=%s", (uid, pid))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return {'redirect':'/annotate', 'msg': 'Submitted.' }

@route('/loadPassageById', method='POST')
def loadPassageById():
    session = request.environ.get('beaker.session')
    if not logged(session):
        return {'redirect': 'home'}

    reviewOf, rtid = getReviewInfo(session)
    passageInfo, uid = getUsernameAndSettings(session)

    fetchXML = (request.forms.get('reset') == 'true')
    xid = reviewOf if not 'xid' in session else session['xid']
    comment, passageid, projectid, resXml = getPassageFromDb(fetchXML, passageInfo, rtid, session, uid,
                                                                      xid)
    passageInfo.update(id = passageid, project = projectid)

    getConfig(passageInfo, projectid)
    
    if not resXml:
        getPassageFromPassagesTable(passageInfo, passageid)
    else:
        passageInfo.update(comment = comment, xml = resXml)
    passageInfo.update(rtid = rtid)
    return passageInfo


def getPassageFromPassagesTable(passageInfo, passageid):
    cur.execute("SELECT passage, status FROM passages WHERE id=%s", (passageid,))
    result = cur.fetchone()
    passageInfo.update(passage=result[0])
    print(result[0])
    isSimpleParse = (result[1] == 1)
    passageInfo.update(simpleParse=isSimpleParse)
    passageInfo.update(mode="review" if result[1] == -1 else "basic")


def getConfig(passageInfo, projectid):
    cur.execute("SELECT configFile, version "
                "FROM projects WHERE id=%s", (projectid,))
    result = cur.fetchone()
    config = result[0]
    scheme_f = open('configs/' + config)
    passageInfo.update(scheme=scheme_f.read())
    version = result[1]
    passageInfo.update(schemeVersion=version)
    scheme_f.close()

#def createLayer()


def getPassageFromDb(fetchXML, passageInfo, rtid, s, uid, xid):
    if xid is not None and xid != -1:
        return getExistingPassageXML(rtid, s, xid)
    return getXMLByPassageId(fetchXML, passageInfo, s, uid)


def getXMLByPassageId(fetchXML, passageInfo, s, uid):
    comment = ''
    resXml = None
    passageid = s['pid']
    projectid = s['prid']
    if fetchXML:
        cur.execute("SELECT xml, comment, ts FROM xmls WHERE paid=%s AND uid=%s AND prid = %s ORDER BY ts DESC",
                    (passageid, uid, projectid))
        result = cur.fetchone()
        ts = None
        if result != None:
            resXml = result[0]
            comment = result[1]
            ts = result[2]
        cur.execute("SELECT xml, comment, ts FROM autosave WHERE paid=%s AND uid=%s ORDER BY ts DESC",
                    (passageid, uid))
        result = cur.fetchone()
        if result != None and (ts == None or ts < result[2]):
            passageInfo.update(autosaveXml=result[0])
            passageInfo.update(autosaveComm=result[1])
    return comment, passageid, projectid, resXml


def getExistingPassageXML(rtid, s, xid):
    if rtid == -1:
        cur.execute("SELECT paid, xml, comment, prid FROM xmls WHERE id=%s ORDER BY ts DESC", (xid,))
        result = cur.fetchone()
    else:
        cur.execute("SELECT x.paid AS xpaid, x.xml AS xxml, x.comment AS xcomment, x.prid AS xprid, x.ts AS xts "
                    "FROM xmls x, xmls x2, reviewTasks rt "
                    "WHERE rt.xid=x2.id AND rt.id=%s AND x.reviewOf=x2.id AND x.uid=rt.uid "
                    "ORDER BY xts DESC", (rtid,))
        result = cur.fetchone()
        if not result:
            cur.execute("SELECT paid, xml, comment, prid FROM xmls WHERE id=%s ORDER BY ts DESC", (xid,))
            result = cur.fetchone()
    passageid = result[0]
    resXml = result[1]
    comm = result[2]
    projectid = result[3]
    if 'xid' in s:
        del s['xid']
    return comm, passageid, projectid, resXml


def getReviewInfo(session):
    if not 'rtid' in session:
        return -1, -1
    cur.execute("SELECT xid FROM reviewTasks WHERE id=%s", (session['rtid'],))
    result = cur.fetchone()
    reviewOf = result[0]
    rtid = session['rtid']
    del session['rtid']
    return reviewOf, rtid


def getUsernameAndSettings(s):
    uid = s['userId']
    cur.execute("SELECT username, settings FROM users WHERE id=%s", (uid,))
    result = cur.fetchone()
    curUsername = result[0]
    settings = result[1]
    res = {'username': curUsername, 'settings': settings}
    return res, uid


@route('/reportUnfit', method='POST')
def reportUnfit():
    s = request.environ.get('beaker.session')
    if not logged(s):
        return {'redirect': 'home'}
    paid = request.forms.get('paid')
    prid = request.forms.get('prid')
    uid = s['userId']
    s['pid'] = None
    try:
        cur.execute("INSERT INTO unfit (uid, paid, prid) VALUES (%s, %s, %s)", (uid, paid, prid))
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    con.commit()
    return {'redirect':'/annotate', 'msg': 'Reported.' }

@route('/helpCode', method='POST')
def helpCode():
    docId = request.forms.get('id')
    docHtml = readDoc(HELP_DOC_FILE, docId)
    return {'msg': docHtml }

@route('/openUserTask', method='POST')
def openUserTask():
    s = request.environ.get('beaker.session')
    if not logged(s):
        return {'redirect': 'home'}
    pid = request.forms.get('pid')
    prid = request.forms.get('prid')
    cur.execute("SELECT status, rid FROM passages WHERE id=%s", (pid,))
    result = cur.fetchone()
    if (result[0] > 0 or (result[0] == -1 and result[1] == s['userId'])):
        if (result[0] == 2):
            try:
                cur.execute("UPDATE passages SET status=-1, rid=%s WHERE id=%s", (s['userId'],pid))
            except Exception, e:
                print(e.pgerror)
                return {'error': e.pgerror}
            con.commit()
        s['pid'] = pid
        s['prid'] = prid
        return {'redirect': '/text'}
    else:
        return {'message': 'Passage not available'}
    
@route('/openUserReviewTask', method='POST')
def openUserReviewTask():
    s = request.environ.get('beaker.session')
    if not logged(s) and not guest(s):
        return {'redirect': 'home'}
    rtid = request.forms.get('rtid')
    try:
        cur.execute("SELECT status FROM reviewTasks WHERE id=%s", (rtid,))
        result = cur.fetchone()
        if (result):
            s['rtid'] = rtid
            return {'redirect': '/text'}
        else:
            return {'message': 'Can\'t find xml'} 
    except Exception, e:
        print(e)
        return {'message': 'Problem in DB'}


@route('/openByXid', method='POST')
def openByXid():
    s = request.environ.get('beaker.session')
    if not logged(s):
        return {'redirect': 'home'}
    xid = request.forms.get('xid')
    s['xid'] = xid
    return {'redirect': '/text'}

@route('/favicon.ico', method='GET')
def favicon():
    return static_file('favicon.ico', root='../../static/gif/')

@route('/:path#.+#', method='GET')
def staticPage(path):
    if path[-5:] == '.html':
        abort(401, "Access denied!")
    if path.find(".") == -1 and path.find("/") == -1:
        return static_file(path + '.html', root='../../static/')
    return static_file(path, root='../../static/')

def write_text_to_file(txt, output_file):
    "writes the string txt into output_file"
    f = open(output_file, "w")
    f.write(txt)
    f.close()

def read_text_from_file(filename):
    "reads from a text file into a string"
    f = open(filename)
    s = f.read()
    f.close()
    return s

def convert_standard_to_site_xml(text):
    print('y1')
    write_text_to_file(text, XML_INPUT_FILE)
    print('y2')
    try:
        returncode = subprocess.call(['/usr/bin/python3', 'convert_standard_to_site.py', XML_INPUT_FILE, XML_OUTPUT_FILE], env={'PYTHONPATH': '.:./..'})
    except Exception, err:
        print(err)
        #traceback.print_exception()
    print('y4')
    if int(returncode) == 0:
        output = read_text_from_file(XML_OUTPUT_FILE)
    else:
        output = None
    return output

# Reading the relevant part in the doc file.
def readDoc(docFile, docId):
    f = open(docFile)
    output = ""
    reading = False
    for line in f:
        if line.strip().startswith(DOC_DELIMITER):
            header = line.strip()[len(DOC_DELIMITER):]
            print(header)
            fields = header.split('#')
            if (fields[0] != docId):
                reading = False
            elif (len(fields) == 1):
                reading = True
            else:
                f.close()
                f_new = open(fields[1])
                output = f_news.read()
                f_new.close()
                return output
        elif line.strip().startswith(DOC_DELIMITER):
            reading = False
        elif (reading):
            output = output + line
    f.close()
    return output


@route('/getLayers', method='POST')
def layers():

    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    try:
        cur.execute("select c.id, c.name, string_agg(p.name, ' + ') as parents, c.source, c.version "
                    "from layers p, layers c, layer_parents link "
                    "where p.id = link.parent_lid and c.id = link.child_lid  and c.displayed = 1"
                    "group by c.id, c.name, c.source, c.version "
                    "order by c.id")
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    try:
        return json.dumps([dict(lid=x[0], name=x[1], parents=x[2], source=x[3], \
                                version=x[4]) for x in result], \
                          ensure_ascii=False)
    except Exception as e:
        print("An error occurred:", e.args[0])

@route('/hideLayers', method='POST')
def hideLayers():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('layers') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE layers SET displayed=0 WHERE id=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return

@route('/hideCategories', method='POST')
def hideCategories():
    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    arr = json.loads('[' + request.forms.get('categories') + ']')
    for i in arr:
        try:
            cur.execute("UPDATE categories SET displayed=0 WHERE cid=%s", (i,))
        except Exception, e:
            print(e.pgerror)
            return {'error': e.pgerror}
    con.commit()
    return

@route('/getCategories', method='POST')
def categories():

    s = request.environ.get('beaker.session')
    if not admin(s):
        return {'redirect': 'home'}
    try:
        lid = request.forms.get('layerId')
        cur.execute("select cid, name, description, family "
                    "from categories "
                    "where lid = %s"
                    "and displayed = 1"
                    "order by cid" % lid)
    except Exception, e:
        print(e.pgerror)
        return {'error': e.pgerror}
    result = cur.fetchall()
    try:
        return json.dumps([dict(cid=x[0], name=x[1], description=x[2], family=x[3]) for x in result], \
                          ensure_ascii=False)
    except Exception as e:
        print("An error occurred:", e.args[0])

@route('/insertCategory', method='POST')
def insertCategory():
    s = request.environ.get('beaker.session')
    if not admin(s) and not guest(s):
        return {'redirect': 'home'}
    newdata = (request.forms.get('name'),request.forms.get('description'),request.forms.get('family'),request.forms.get('lid'))
    try:
        cur.execute("INSERT INTO categories (name, description, family, displayed, lid) "
                    "VALUES (%s, %s, %s, 1, %s) RETURNING cid", newdata)
    except Exception, e:
        print("An error ocurred:", e.args[0])
        raise Exception("Insertion failed")
    con.commit()
    return

@route('/createNewLayer', method='GET')
def createNewLayer():
    s = request.environ.get('beaker.session')
    if not admin(s) and not guest(s):
        return {'redirect': 'home'}
    try:
        cur.execute("insert into layers (name) values('') returning id")
        result = cur.fetchone()
        return str(result[0])
    except Exception, e:
        print("An error ocurred:", e.args[0])
        raise Exception("Layer creation failed")
    con.commit()


session_opts = {
    'session.type': 'file',
    'session.cookie_expires': 60*24*60*2, #two days in seconds
    'session.data_dir': './data',
    'session.auto': True
}
sm = SessionMiddleware(app(), session_opts)

debug(True) #remove this
run(host='localhost', port=5000, app=sm)




