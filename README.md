### Intro 
This software uses mt5 package to connect to the metatrader api. Moreover  
certain commands are sent using MQL interface, as those are not available in python api.  
The **backend** is a flask server written in python.  
The **frontend** is written using react and connects to the backed using proxy configuration.

### Runtimes
Frontend uses react server which is run in
*node.js*  
Backend uses flask server which is run in
*python3.x* 
### Packages
Packages listed in frontend/package.json and backend/requirements.txt need to be installed. 

### Additional configuations
**MQL**  
*Server.mq5* uses a prewritten script called *server-socket-mt4-mt5.mqh* to get access to sockets and events  
https://www.mql5.com/en/blogs/post/706665


**GOOGLE DRIVE**  
- Define *IMAGES_FOLDER_ID*. This is the folder id used to get a google resource folder to uploaded charts  

- Generate *sercretsfile.json* and place into *config* folder  
https://developers.google.com/sheets/api/quickstart/go
