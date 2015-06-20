#!/usr/bin/env python
import psycopg2

con = psycopg2.connect(host="pgserver", database="work")
cur = con.cursor()
cur.execute("SET search_path TO omria01")
cur.execute('ALTER TABLE passages ADD COLUMN direction INTEGER DEFAULT 0')
con.commit()


