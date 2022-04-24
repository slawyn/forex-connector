import sys
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials

import datetime
from datetime import timedelta, date
import time


from pydrive.drive import GoogleDrive
from pydrive.auth  import GoogleAuth

from  helpers import *
from chart import DrawChart


class DriveFileController:
    REQUEST_SCOPE = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
    def __init__(self, secrets, folderid, spreadsheet, worksheet, dir):

        # use creds to create a client to interact with the Google Drive API
        creds = ServiceAccountCredentials.from_json_keyfile_name(secrets, DriveFileController.REQUEST_SCOPE)
        client = gspread.authorize(creds)

        # Authenticate
        gauth = GoogleAuth()
        gauth.credentials = creds
        self.drive = GoogleDrive(gauth)
        self.folderid = folderid

        # Inits
        self.worksheet = client.open(spreadsheet).worksheet(worksheet)
        self.lastPosition = 0
        self.database = self.worksheet.get_all_values()
        self.next_free_idx = len(self.database)
        self.dir = dir

    def build_request_images(self):
        return "'%s' in parents and trashed=false"%self.folderid

    def get_uploaded_images(self):
        images = self.drive.ListFile({'q': self.build_request_images()}).GetList()
        images_dic = {}
        for k in images:
            images_dic[k["title"].split(".")[0]] = k["id"]
        return images_dic

    def delete_uploaded_images():
        request_template = "'root' in parents and trashed=false"
        file_lst = drive.ListFile({'q': request_template}).GetList()
        for folder in file_lst:
            log(folder['title'])
            file1 = drive.CreateFile({'id': folder["id"]})
            file1.Delete()


    def update_google_drive(self, positions):
        # Last position in the sheet
        positions_google = []

        # Formatting
        self.worksheet.format("A1:Q1",{'textFormat':{'fontSize':10,'fontFamily':"Calibri","bold":True}})
        self.worksheet.format("B2:Q%d"%self.next_free_idx,{'textFormat':{'fontSize':10,'fontFamily':"Calibri"}})
        self.worksheet.format("A1:A%d"%self.next_free_idx,{'textFormat':{'fontSize':10,'fontFamily':"Calibri","bold":True}})

        if self.next_free_idx >1:
            positions_google =list(map(lambda x: x[0],self.database))

        # Update rows and images
        # if position is not in the already saved list
        images_lis = self.get_uploaded_images()
        for pid in positions:
            pd = positions[pid]

            # add info to database it not uploaded
            if pid not in positions_google:
                entry = pd.get_data_for_excel()
                self.database.append(entry)
                self.next_free_idx = self.next_free_idx + 1
                self.worksheet.update('A%d:M%d'%(self.next_free_idx,self.next_free_idx), [entry])

            # add only if image was not uploaded
            if pid not in images_lis.keys():
                try:
                    img_name = DrawChart(self.dir).generate_chart(pd)

                    log(" Uploading %s"%img_name)
                    file = self.drive.CreateFile({'title': img_name,'parents':[{'id':self.folderid}]})
                    file.SetContentFile(os.path.join(self.dir, img_name))
                    file.Upload()

                    # Add to the array
                    images_lis[pid] = file["id"]

                    # Change Permissions so anyone with the link can view it
                    permission = file.InsertPermission({
                        'type': 'anyone',
                        'value': 'anyone',
                        'role': 'reader'})
                except Exception as e:
                    log(e)


        # Add Image links to the rows
        links = self.worksheet.range('P1:P%d'%(self.next_free_idx))
        for i in range(1,self.next_free_idx):
            row = self.database[i]
            pid = str(row[0])

            link = links[i].value

            # if there is no link
            if link == "":
                if pid in images_lis:
                    log(" Inserting \"Hyperlink\" into P%d"%(i+1))
                    file = self.drive.CreateFile({'id': images_lis[pid],'parents':[{'id':self.folderid}]})
                    file.FetchMetadata(fetch_all=True)
                    link = file['alternateLink']

                    #if "www." not in link and "https://" in link:
                    #    link = link.replace("https://","https://www.")
                    value = '=HYPERLINK(\"%s\",\"<link>\")'%(link)
                    self.worksheet.update_acell('P%d'%(i+1), value)
                else:
                    log(" Inserting \"none\" into P%d"%(i+1))
                    self.worksheet.update_acell('P%d'%(i+1),"none")
        '''
        '''
