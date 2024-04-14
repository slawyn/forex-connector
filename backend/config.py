from helpers import load_json
import os

class Config:
    def __init__(self, filename):
        self.dirname = os.path.dirname(filename)
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
        return os.path.abspath(os.path.join(self.dirname, self.dictionary["local"]["dir"]))
    
    def get_metatrader_configuration(self):
        return os.path.join(self.dirname, self.dictionary["metatrader"]["dir"])
    
    def get_metatrader_process(self): 
        return self.dictionary["metatrader"]["process"]
