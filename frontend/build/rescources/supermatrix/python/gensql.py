#!/bin/python
# module with various functions to read/write genesis data to an sql database

# Import standard Python modules
import os, sys, string, pdb
import easygui
import pyodbc
import traceback
import logging
import collections


class nvgsql:
    def __init__(self, jobname="", remote=True, dsn="nvg_sql"):
        try:
            self.cnxn = pyodbc.connect('DSN=%s' % dsn)
            self.cursor = self.cnxn.cursor()
            if not self.cursor:
                logging.warning("sql cursor not created.  Exiting.")
                return None

        except Exception as e:
            logging.warning("problem initializing job:" + jobname + ", " + repr(e))
            return None


    def getstackup(self, jqs_number):
        table=False
        headers=True
        sql = "select * from v_a_stackups where jobname = '%s'" % (jobname)
        try:
            self.cursor.execute(sql)
            columns = [column[0] for column in self.cursor.description]
            results = []
            rows = self.cursor.fetchall()
            if table:
                if headers:
                    combined = [columns] + rows
                    return combined
                else:
                    return rows
            else:
                for row in rows:
                  results.append(dict(zip(columns, row)))
                  
                return results
        except:
            easygui.exceptionbox("Failure selecting from database")

    def getjobJQS(self, jobname):
        sql = "select jqs_number from genesis_jobs where jobname = '%s'" % (jobname)
        self.cursor.execute(sql)
        for row in self.cursor:
            results = row
        return results

    def getQuery(self, query):
        table=False
        headers=True
        query = ' '.join(query)
        try:
            self.cursor.execute(query)
            columns = [column[0] for column in self.cursor.description]
            results = []
            rows = self.cursor.fetchall()
            if table:
                if headers:
                    combined = [columns] + rows
                    return combined
                else:
                    return rows
            else:
                for row in rows:
                  results.append(dict(zip(columns, row)))
                  
                return results
        except:
            easygui.exceptionbox("Failure selecting from database")


if __name__ == '__main__':
    jobname = sys.argv[1]
    #print sys.argv[0] + sys.argv[1] + sys.argv[2]
    nql = nvgsql(jobname, True)
    if sys.argv[1] == '-query':
        results = nql.getQuery(sys.argv[2:])
    else:
        print "error: invalid command line arguments .. Use -query followed by query in double quotation marks to execute an SQL query"
    print results
