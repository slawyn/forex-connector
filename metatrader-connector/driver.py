import sys
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials

import datetime
from datetime import datetime, timedelta, date
import time


from pydrive.drive import GoogleDrive
from pydrive.auth  import GoogleAuth

import MetaTrader5 as mt5

from  helpers import *
from chart import DrawChart


class DriveFileController:
    REQUEST_SCOPE = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
    def __init__(self, secrets, folderid, spreadsheet, worksheet):

        # use creds to create a client to interact with the Google Drive API
        creds = ServiceAccountCredentials.from_json_keyfile_name(secrets, DriveFileController.REQUEST_SCOPE)
        client = gspread.authorize(creds)


        # Used for managing images
        gauth = GoogleAuth()
        gauth.credentials = creds

        self.drive = GoogleDrive(gauth)
        self.folderid = folderid


        # Inits
        self.worksheet = client.open(spreadsheet).worksheet(worksheet)
        self.freeRow = 0
        self.lastPosition = 0
        self.allValues = None

    def getImagesRequest(self):
        return "'%s' in parents and trashed=false"%self.folderid

    def getAllUploadedImages(self):
        images = self.drive.ListFile({'q': self.getImagesRequest()}).GetList()
        imagesDic = {}
        for k in images:
            imagesDic[k["title"].split(".")[0]] = k["id"]
        return imagesDic

    def deleteAllUploadedFiles():
        request_template = "'root' in parents and trashed=false"
        file_list = drive.ListFile({'q': request_template}).GetList()
        for folder in file_list:
            print(folder['title'])
            file1 = drive.CreateFile({'id': folder["id"]})
            file1.Delete()

    # Extract and output all of the values
    def loadValuesFromSheet(self):
        self.allValues = self.worksheet.get_all_values()
        self.freeRow = len(self.allValues)
        self.header = self.allValues[0]
        #log(self.allValues)


    def updateInformation(self, positionarray):
        # Last position in the sheet
        self.loadValuesFromSheet()
        positionsUploaded = []

        self.worksheet.format("A1:Q1",{'textFormat':{'fontSize':10,'fontFamily':"Calibri","bold":True}})
        self.worksheet.format("B2:Q%d"%self.freeRow,{'textFormat':{'fontSize':10,'fontFamily':"Calibri"}})
        self.worksheet.format("A1:A%d"%self.freeRow,{'textFormat':{'fontSize':10,'fontFamily':"Calibri","bold":True}})


        #self.freeRow = 1
        if self.freeRow >1:
            positionsUploaded =list(map(lambda x: x[0],self.allValues))

        #log("Uploaded Positions:")
        #log(positionsUploaded)


        # Update rows
        for positionData in positionarray:
            # if position is not in the already saved list
            position = positionData.position
            if str(position) not in positionsUploaded:

                self.freeRow = self.freeRow + 1
                entry = positionData.getDataForExcelRow()
                self.allValues.append(entry)
                self.worksheet.update('A%d:M%d'%(self.freeRow,self.freeRow), [entry])



        # upload images
        # only the ones that can be generated
        allImages = self.getAllUploadedImages()
        imagekeys = allImages.keys()
        for positionData in positionarray:
            if positionData.exchange != 0:
                if str(positionData.position) not in imagekeys:

                    chart = DrawChart(positionData)
                    chart.drawChart()

                    log(" Uploading %s"%chart.chartname)
                    file = self.drive.CreateFile({'title': chart.chartname,'parents':[{'id':self.folderid}]})
                    file.SetContentFile(os.path.join(chart.chartdir, chart.chartname))
                    file.Upload()

                    # Add to the array
                    allImages[(str(positionData.position))] = file["id"]

                    # Change Permissions so anyone with the link can view it
                    permission = file.InsertPermission({
                        'type': 'anyone',
                        'value': 'anyone',
                        'role': 'reader'})

        #
        # Add Image links to the rows
        imagekeys = allImages.keys()
        links = self.worksheet.range('P1:P%d'%(self.freeRow))
        for i in range(1,self.freeRow):
            row = self.allValues[i]
            position = str(row[0])

            link = links[i].value

            # if there is no link
            if link == "":
                if position in allImages:
                    log(" Inserting \"Hyperlink\" into P%d"%(i+1))
                    file = self.drive.CreateFile({'id': allImages[str(position)],'parents':[{'id':self.folderid}]})
                    file.FetchMetadata(fetch_all=True)
                    link = file['alternateLink']

                    #if "www." not in link and "https://" in link:
                    #    link = link.replace("https://","https://www.")
                    value = '=HYPERLINK(\"%s\",\"<link>\")'%(link)
                    self.worksheet.update_acell('P%d'%(i+1),value)
                else:
                    log(" Inserting \"none\" into P%d"%(i+1))
                    self.worksheet.update_acell('P%d'%(i+1),"none")
