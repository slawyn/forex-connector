//+------------------------------------------------------------------+
//|                                                       Server.mq5 |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"
/* ###################################################################

Example socket server.
Code can be used as both MQ4 and MQ5 (on both 32-bit and 64-bit MT5)

Receives messages from the example client and simply writes them
to the Experts log.

Also contains functionality for handling files sent by the example 
file-sender script.

In addition, you can telnet into the server's port. Any CRLF-terminated
message you type is similarly printed to the Experts log. You
can also type in the commands "quote", to which the server reponds
with the current price of its chart, or "close", which causes the
server to shut down the connection.

As well as demonstrating server functionality, the use of Receive()
and the event-driven handling are also applicable to a client
which needs to receive data from the server as well as just sending it.

################################################################### */


#property strict

// --------------------------------------------------------------------
// Import user32.dll
// --------------------------------------------------------------------
#import "user32.dll"
   void keybd_event(int bVk, int bScan, int dwFlags, int dwExtraInfo);
   int GetParent(int hWnd);
   bool SetWindowPlacement(int hWnd,int & lpwndpl[]);
   bool ShowWindow(int hWnd, int nCmdShow);
   int GetAncestor(int, int);
   int SendMessageA(int hWnd, int Msg, int wParam, int lParam);
   int PostMessageA(int hWnd, int Msg, int wParam, int lParam);
#import

#define WM_MDITILE      0x226
#define WM_MDICASCADE   0x0227
#define SW_MAXIMIZE 3
#define SW_MINIMIZE 6
#define SW_RESTORE 9
#define SW_SHOWMINIMIZED 11

// --------------------------------------------------------------------
// Include socket library, asking for event handling
// --------------------------------------------------------------------
#define SOCKET_LIBRARY_USE_EVENTS
#include <socket-library-mt4-mt5.mqh>

// --------------------------------------------------------------------
// EA user inputs
// --------------------------------------------------------------------
input ushort   ServerPort = 23456;  // Server port

// --------------------------------------------------------------------
// Global variables and constants
// --------------------------------------------------------------------
// Frequency for EventSetMillisecondTimer(). Doesn't need to 
// be very frequent, because it is just a back-up for the 
// event-driven handling in OnChartEvent()
#define TIMER_FREQUENCY_MS    1000

// Server socket
ServerSocket * glbServerSocket = NULL;

// Array of current clients
ClientSocket * glbClients[];

// Watch for need to create timer;
bool glbCreatedTimer = false;


// --------------------------------------------------------------------
// Local definitions
// --------------------------------------------------------------------
#define FILE_TEMPLATE       "alex.tpl"
#define PATH_TEMPLATE       "\\MQL5\\profiles\\templates\\"
#define PERIOD_COUNT        4

/* Enum for the commander state */
enum CommanderState_e
{
   CommanderStateInactive = 0,
   CommanderStateRemoveAllCharts,
   CommanderStateSpawnNewCharts
};

/* Local variables */
string sInstrumentToShow = "";
string sFullTemplatePath = TerminalInfoString(TERMINAL_DATA_PATH)+PATH_TEMPLATE+FILE_TEMPLATE;
CommanderState_e eCommanderState = CommanderStateInactive;
long lMainChartId = 0;
long lPeriods[PERIOD_COUNT] = {PERIOD_M5, PERIOD_H4, PERIOD_D1, PERIOD_MN1}; 

/* Set Commander to execute */
void CommanderSetCommand(string strInstr, int state)
{
   sInstrumentToShow = strInstr;
   eCommanderState = state;
}

void CommanderStateMachineRun()
{  
   long lChid;
   int iWindowHandle;
   bool bError;
   int i;
   switch(eCommanderState)
   {  
      /* Wait for commands */
      case CommanderStateInactive:
      break;
      
      /* Close old charts*/
      case CommanderStateRemoveAllCharts:
      lChid = ChartFirst();
      while(lChid > 0)
      {  
         long lNextID = ChartNext(lChid);
         if(lChid != lMainChartId)
         {
            ChartClose(lChid);
         }
         lChid = lNextID;
      }
      eCommanderState = CommanderStateSpawnNewCharts;
      break;
      
      
      /* Open new charts*/
      case CommanderStateSpawnNewCharts:
      bError = false;
      for(i = 0; i < PERIOD_COUNT; ++i)
      {
         long lChartId = ChartOpen(sInstrumentToShow, lPeriods[i]);
         if(lChartId > 0)
         {
             ChartApplyTemplate(lChartId, FILE_TEMPLATE);
         }
         else
         {
            bError = true;
         }
      }

      /* Arrange charts in tile layout if there is no error*/
      if(!bError)
      {
         Print("SUCCESS:Loaded for all charts:"+sFullTemplatePath);
         
         iWindowHandle=(int)ChartGetInteger(0,CHART_WINDOW_HANDLE);
         iWindowHandle = GetParent(GetParent(iWindowHandle));
         SendMessageA(iWindowHandle, WM_MDITILE, 0, 0);
      }
      else
      {
         Print("ERROR: Charts wasn't created" + i);
      }
      
      eCommanderState = CommanderStateInactive;
      break;
      
   }
}

// --------------------------------------------------------------------
// Initialisation - set up server socket
// --------------------------------------------------------------------
void OnInit()
{
   // If the EA is being reloaded, e.g. because of change of timeframe,
   // then we may already have done all the setup. See the 
   // termination code in OnDeinit.
    lMainChartId = ChartID();

   int hWnd = (int)ChartGetInteger(lMainChartId, CHART_WINDOW_HANDLE, 0);
   int parent = GetParent(hWnd);
   ShowWindow(parent, SW_SHOWMINIMIZED);
   if (glbServerSocket) {
      Print("SERVER:Reloading EA with existing server socket");
   } else {
      // Create the server socket
      glbServerSocket = new ServerSocket(ServerPort, true);
      if (glbServerSocket.Created()) {
         Print("SERVER:Server socket created");
   
         // Note: this can fail if MT4/5 starts up
         // with the EA already attached to a chart. Therefore,
         // we repeat in OnTick()
        
      } else {
         Print("SERVER:Server socket FAILED - is the port already in use?");
      }
      glbCreatedTimer = EventSetMillisecondTimer(TIMER_FREQUENCY_MS);
   }
}


// --------------------------------------------------------------------
// Termination - free server socket and any clients
// --------------------------------------------------------------------
void OnDeinit(const int reason)
{  
   Print(reason);
   switch (reason) {
      case REASON_CHARTCHANGE:
         // Keep the server socket and all its clients if 
         // the EA is going to be reloaded because of a 
         // change to chart symbol or timeframe 
         break;
         
      default:
         
         // For any other unload of the EA, delete the 
         // server socket and all the clients 
         glbCreatedTimer = false;
         
         // Delete all clients currently connected
         for (int i = 0; i < ArraySize(glbClients); i++) {
            delete glbClients[i];
         }
         ArrayResize(glbClients, 0);
      
         // Free the server socket. *VERY* important, or else
         // the port number remains in use and un-reusable until
         // MT4/5 is shut down
         delete glbServerSocket;
         glbServerSocket = NULL;
         Print("SERVER:Server socket terminated");
         break;
   }
}


// --------------------------------------------------------------------
// Timer - accept new connections, and handle incoming data from clients.
// Secondary to the event-driven handling via OnChartEvent(). Most
// socket events should be picked up faster through OnChartEvent()
// rather than being first detected in OnTimer()
// --------------------------------------------------------------------
void OnTimer()
{
   CommanderStateMachineRun();
   
   // Accept any new pending connections
   AcceptNewConnections();
   
   // Process any incoming data on each client socket,
   // bearing in mind that HandleSocketIncomingData()
   // can delete sockets and reduce the size of the array
   // if a socket has been closed

   for (int i = ArraySize(glbClients) - 1; i >= 0; i--) {
      HandleSocketIncomingData(i);
   }
}


// --------------------------------------------------------------------
// Accepts new connections on the server socket, creating new
// entries in the glbClients[] array
// --------------------------------------------------------------------
void AcceptNewConnections()
{
   // Keep accepting any pending connections until Accept() returns NULL
   ClientSocket * pNewClient = NULL;
   do {
      pNewClient = glbServerSocket.Accept();
      if (pNewClient != NULL) {
         int sz = ArraySize(glbClients);
         ArrayResize(glbClients, sz + 1);
         glbClients[sz] = pNewClient;
         Print("SERVER:New client connection");
         
         pNewClient.Send("Hello\r\n");
      }
      
   } while (pNewClient != NULL);
}


// --------------------------------------------------------------------
// Handles any new incoming data on a client socket, identified
// by its index within the glbClients[] array. This function
// deletes the ClientSocket object, and restructures the array,
// if the socket has been closed by the client
// --------------------------------------------------------------------
void HandleSocketIncomingData(int idxClient)
{
   ClientSocket * pClient = glbClients[idxClient];

   // Keep reading CRLF-terminated lines of input from the client
   // until we run out of new data
   bool bForceClose = false; 
   string strCommand;
   do {
      strCommand = pClient.Receive("\r\n"); 
      if (strCommand == "QUOTE") {
         pClient.Send(Symbol() + "," + DoubleToString(SymbolInfoDouble(Symbol(), SYMBOL_BID), 6) + "," + DoubleToString(SymbolInfoDouble(Symbol(), SYMBOL_ASK), 6) + "\r\n");

      } else if (strCommand == "CLOSE") {
         bForceClose = true;
      } else if (StringFind(strCommand, "INSTRUMENT:") == 0) {
         CommanderSetCommand(StringSubstr(strCommand, 11), CommanderStateRemoveAllCharts);
         
      } else if (StringFind(strCommand, "FILE:") == 0) {
      
         // Extract the base64 file data - the message minus the FILE: header
         string strFileData = StringSubstr(strCommand, 5);
         uchar arrBase64[];
         StringToCharArray(strFileData, arrBase64, 0, StringLen(strFileData));
         
         // Do base64 decoding on the data, converting it to the zipped data 
         uchar arrZipped[], dummyKey[];
         if (CryptDecode(CRYPT_BASE64, arrBase64, dummyKey, arrZipped)) {
            
            // Unzip the data 
            uchar arrOriginal[];
            if (CryptDecode(CRYPT_ARCH_ZIP, arrZipped, dummyKey, arrOriginal)) {

               // Okay, we should now have the raw file 
               int f = FileOpen("receive.dat", FILE_BIN | FILE_WRITE);
               if (f == INVALID_HANDLE) {
                  Print("SERVER:Unable to open receive.dat for writing");
               } else {
                  FileWriteArray(f, arrOriginal);
                  FileClose(f);
                  
                  Print("SERVER:Created receive.dat file");
               }
            } else {
               Print("SERVER:Unzipping of file data failed");               
            }
         } else {
            Print("SERVER:Decoding from base64 failed");
         }
         
      } else if (strCommand != "") {
         // Potentially handle other commands etc here.
         // For example purposes, we'll simply print messages to the Experts log
         Print("SERVER:<- ", strCommand);
      }
   } while (strCommand != "");

   // If the socket has been closed, or the client has sent a close message,
   // release the socket and shuffle the glbClients[] array
   if (!pClient.IsSocketConnected() || bForceClose) {
      Print("SERVER:Client has disconnected");

      // Client is dead. Destroy the object
      delete pClient;
      
      // And remove from the array
      int ctClients = ArraySize(glbClients);
      for (int i = idxClient + 1; i < ctClients; i++) {
         glbClients[i - 1] = glbClients[i];
      }
      ctClients--;
      ArrayResize(glbClients, ctClients);
   }
}


// --------------------------------------------------------------------
// Use OnTick() to watch for failure to create the timer in OnInit()
// --------------------------------------------------------------------
void OnTick()
{
   if (!glbCreatedTimer) glbCreatedTimer = EventSetMillisecondTimer(TIMER_FREQUENCY_MS);
}

// --------------------------------------------------------------------
// Event-driven functionality, turned on by #defining SOCKET_LIBRARY_USE_EVENTS
// before including the socket library. This generates dummy key-down
// messages when socket activity occurs, with lparam being the 
// .GetSocketHandle()
// --------------------------------------------------------------------
void OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam)
{
   if (id == CHARTEVENT_KEYDOWN) 
   {
      // If the lparam matches a .GetSocketHandle(), then it's a dummy
      // key press indicating that there's socket activity. Otherwise,
      // it's a real key press
         
      if (lparam == glbServerSocket.GetSocketHandle()) {
         // Activity on server socket. Accept new connections
         Print("SERVER:New server socket event - incoming connection");
         AcceptNewConnections();

      } else {
         // Compare lparam to each client socket handle
         for (int i = 0; i < ArraySize(glbClients); i++) {
            if (lparam == glbClients[i].GetSocketHandle()) {
               HandleSocketIncomingData(i);
               return; // Early exit
            }
         }
         
         /* If we get here, then the key press does not seem
         */ 
      }
   }
}


