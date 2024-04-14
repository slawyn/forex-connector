import sys
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials

import datetime
from datetime import timedelta, date
import time


from pydrive.drive import GoogleDrive
from pydrive.auth import GoogleAuth

from google.chart import Chart
from helpers import *


class DriveFileController:
    REQUEST_SCOPE = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    FIRST_COLUMN = 'A'
    LAST_COLUMN = 'N'
    LINK_COLUMN = 'O'

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
        return "'%s' in parents and trashed=false" % self.folderid

    def get_uploaded_images(self):
        images = self.drive.ListFile({'q': self.build_request_images()}).GetList()
        images_dic = {}
        for k in images:
            images_dic[k["title"].split(".")[0]] = k["id"]
        return images_dic

    def delete_uploaded_images(self):
        request_template = "'root' in parents and trashed=false"
        file_lst = self.drive.ListFile({'q': request_template}).GetList()
        for folder in file_lst:
            log(folder['title'])
            file1 = self.drive.CreateFile({'id': folder["id"]})
            file1.Delete()

    def update_google_sheet(self, positions):
        # Last position in the sheet
        positions_google = []

        # Formatting
        self.worksheet.format("A1:Q1", {'textFormat': {'fontSize': 10, 'fontFamily': "Calibri", "bold": True}})
        self.worksheet.format("B2:O%d" % self.next_free_idx, {'textFormat': {'fontSize': 10, 'fontFamily': "Calibri"}})
        self.worksheet.format("A1:A%d" % self.next_free_idx, {'textFormat': {'fontSize': 10, 'fontFamily': "Calibri", "bold": True}})

        if self.next_free_idx > 1:
            positions_google = list(map(lambda x: x[0], self.database))

        # Update rows and images
        # if position is not in the already saved list
        uploaded_images = self.get_uploaded_images()
        for pid in positions:
            pd = positions[pid]

            # add info to database it not uploaded
            if pid not in positions_google:
                entry = pd.get_data_for_excel()
                self.database.append(entry)
                self.next_free_idx += 1
                self.worksheet.update(f'{DriveFileController.FIRST_COLUMN}{self.next_free_idx}:{DriveFileController.LAST_COLUMN}{ self.next_free_idx}', [entry])

            # Generate only if the image does not exist
            img_name = Chart.get_name(pd.get_id())
            chartpath = os.path.join(os.path.abspath(self.dir), img_name )
            if not os.path.exists(chartpath):
                Chart().generate_chart(chartpath, pd.get_id(), pd.get_rates(), pd.get_limits(), pd.get_symbol_name(), pd.get_deals())

            # Add only if image was not uploaded
            if pid not in uploaded_images.keys():
                try:
                    log(f" Uploading {img_name}")
                    file = self.drive.CreateFile({'title': img_name, 'parents': [{'id': self.folderid}]})
                    file.SetContentFile(os.path.join(self.dir, img_name))
                    file.Upload()

                    # Add to the array
                    uploaded_images[pid] = file["id"]

                    # Change Permissions so anyone with the link can view it
                    permission = file.InsertPermission({
                        'type': 'anyone',
                        'value': 'anyone',
                        'role': 'reader'})
                except Exception as e:
                    log(e)

        # Add Image links to the rows
        links = self.worksheet.range(f'{DriveFileController.LINK_COLUMN}1:{DriveFileController.LINK_COLUMN}{self.next_free_idx}')
        for i in range(1, self.next_free_idx):
            row = self.database[i]

            # Insert link if there is one
            link = links[i].value
            if link == "":
                value = 'none'
                pid = str(row[0])
                if pid in uploaded_images:
                    file = self.drive.CreateFile({'id': uploaded_images[pid], 'parents': [{'id': self.folderid}]})
                    file.FetchMetadata(fetch_all=True)
                    link = file['alternateLink']

                    # if "www." not in link and "https://" in link:
                    #   link = link.replace("https://","https://www.")
                    value = '=HYPERLINK(\"%s\",\"<link>\")' % (link)

                log(f' Inserting {value} into {DriveFileController.LINK_COLUMN}{i+1}')
                self.worksheet.update_acell(f'{DriveFileController.LINK_COLUMN}{i+1}', value)
