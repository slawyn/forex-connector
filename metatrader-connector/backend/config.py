from helpers import load_json


class Config:
    def __init__(self, filename):
        self.dictionary = load_json(filename)

    def get_google_secrets_file(self):
        return self.dictionary["google"]["secretsfile"]

    def get_google_folder_id(self):
        return self.dictionary["google"]["folderid"]

    def get_google_spreadsheet_info(self):
        return (self.dictionary["google"]["spreadsheet"], self.dictionary["google"]["worksheet"])

    def get_google_spreadsheet(self):
        return self.dictionary["google"]["spreadsheet"]

    def get_google_worksheet(self):
        return self.dictionary["google"]["worksheet"]

    def get_google_startdate(self):
        return self.dictionary["google"]["date"]

    def get_export_folder(self):
        return self.dictionary["local"]["trades"]
