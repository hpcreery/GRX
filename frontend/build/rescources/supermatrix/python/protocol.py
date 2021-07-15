import sys, json
from pyGenesis import genClasses
from pyGenesis import genCommands
from pyGenesis import genFeatures

variable = "sendCmd"

gen = genClasses.Genesis(remote=True)

response = getattr(gen, variable)("COM zoom_home")

print response

    def getsupermatrix(self):
        self.dlog("")
        sm = []  # array of dicts
        self.job.matrix.getInfo()
        self.step.getInfo()
        self.step.getLayers()
        mtx = self.job.matrix
        rows = mtx.returnRows(names=0)
        for row in rows:
            smr = {}
            smr.update(mtx.getRowInfo(row))
            smr.update({"rownum": mtx.getRow(smr["name"])})
            smr.update(self.step.layers[smr["name"]].getGenesisAttrs())  # return a dict of all attrs in the layer
            self.dlog(smr)
            sm.append(smr)

        return sm

#Matrix
    def getInfo(self):
        """ Called when the info dictionary is accessed if not already created.  Populates info
        dictionary."""
        self.info = self.DO_INFO(' -t matrix -e ' + self.job.name + '/matrix')
        # Force all gROWname elements to string values
        for x in xrange(len(self.info['gROWname'])):
            self.info['gROWname'][x] = str(self.info['gROWname'][x])
        return self.info

#Step
    def getInfo(self):
        """ Build the self.info dictionary... Doesn't do a full command (excluding -d from info command)
        because it does LIMITS, which takes forever!  Returns <inst>.info"""
        self.info = {}
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d LAYERS_LIST')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d CHECKS_LIST')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d NETS_LIST')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d CHECKS_LIST')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d ACTIVE_AREA')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d NUM_SR')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d SR')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d SR_LIMITS')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d NUM_REPEATS')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d PROF_LIMITS')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d PROF')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d DATUM')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d REPEAT')
        self.info.update(self.tmp)
        self.tmp = self.DO_INFO('-t step -e ' + self.job.name + '/' + self.name + ' -d ATTR')
        self.info.update(self.tmp)
        # ? not sure if needed
        # self.tmp = self.DO_INFO('-t step -e '+self.job.name+'/'+self.name + ' -d CHK_ATTR')
        # self.info.update(self.tmp)
        return self.info

    def DO_INFO(self, args):
        """ This is the command COM info,...  returns a dictionary with all the information in the
        output file from the info command.  Each array of information is accessed by a key to the
        dictionary that is returned. LIMITATION: Any string resembling a number will be converted
        to a number.  This means that a layer with the name '1.' or '1' will be returned later as
        the float 1.0
            args - arguments to the info command as a string"""
        self.COM('info,out_file=%s,write_mode=replace,args=%s' % (self.tmpfile, args))
        # self.PAUSE('Hi')
        lineList = open(self.tmpfile, 'r').readlines()
        os.unlink(self.tmpfile)
        infoDict = self.parseInfo(lineList)
        return infoDict


#SQL

    def populate_areko_view(self):
        self.dlog("")
        with self.app.subWindow("arkeo"):
            with self.app.panedFrame("arkeobody"):
                rows = self.nvc.getarkeostack(cols=self.arkeo_header_cols.values(), table=True, toponly=True)
                if rows:
                    self.app.replaceAllTableRows("arkeotable", rows)
                    rows = self.nvc.getarkeostack(cols=self.arkeo_layer_cols.values(), table=True)
                    self.app.replaceAllTableRows("arkeotablelayers", rows)
                else:
                    easygui.msgbox("No stackup found in arkeo for JQS number.")


    def getarkeostack(self, cols=[], table=False, toponly=False):  # gets stackup data from arkeo
        self.dlog("")
        jqs = self.job.jqs_number
        if toponly:
            sql = "select top 1 "
        else:
            sql = "select "
        if not jqs:
            easygui.msgbox("No JQS number found in Genesis.  Please set and try again.")
        if cols:
            sql = sql + ",".join(cols) + " from v_a_stackups where JobName = '%s'" % (jqs)
        else:
            sql = sql + "* from v_a_stackups where JobName = '%s'" % (jqs)

        stack = self.gsql.selectsql(sql, table)
        self.dlog("returning arkeo stack %s" % str(stack))
        return stack


    def selectsql(self, sql, table=False, headers=False):  # returns the results of q query as a tablwe or an array of dict
        sql = "select " + ",".join(self.cols) + " from v_a_stackups where JobName = '%s'" % (jqs)
        logging.debug("Select SQL:" + sql)
        try:
            self.cursor.execute(sql)
            columns = [column[0] for column in self.cursor.description]
            results = []
            rows = self.cursor.fetchall()
            if table:
                if headers:
                    print rows
                    print columns
                    combined = [columns] + rows
                    print combined
                    return combined
                else:
                    return rows
            else:
                for row in rows:
                    results.append(dict(zip(columns, row)))
                return results
        except:
            easygui.exceptionbox("Failure selecting from database")