#!/usr/bin/env python
import psycopg2
import sqlite3
sqCon = sqlite3.connect('huca.db')
sqCur = con.cursor()
pgCon = psycopg2.connect(host="pgserver", database="work")
pgCur = con.cursor()
pgCur.execute("SET search_path TO omria01")
f = open('junk.py')
lines = f.readlines()
for line in lines:
    if "CREATE TABLE" not in line:
        continue
    paren = line.strip.split("(")
    tableName = paren[0].split()[2]
    fields = [x.split()[0] for x in paren[1].split(",")]
    print tableName, fields
    sqCur.execute("SELECT * FROM %s"%tableName)
    res = sqCur.fetchall()
    fields = ', '.join(fields)
    for r in res:
        values = ', '.join(r)
        pgCur.execute("INSERT INTO %s (%s) VALUES (%s)"%(tableName, fields, values))
    pgCon.commit()
