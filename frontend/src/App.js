// Importing modules
import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import "./App.css";
import Symbols from "./tabs/Symbols";
import Trader from "./tabs/Trader";
import History from "./tabs/History";
import Header from "./tabs/Header";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const mapTerminalData = (data) => {
  return Object.entries(data).map(([key, value]) => { return { id: key, items: value } });
};

function App() {
  /**
   * Terminal data is numbers, and symbol data is per symbol
   */
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [terminalData, setTerminalData] = React.useState({
    date: "",
    account: [],
    headers: [],
    instruments: {},
    op_headers: [],
    open: {}
  });
  /**
   * Positional data represents open orders, and error data as status evaluation
   */
  const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });
  const [errorData, setErrorData] = React.useState({ error: 0, text: "" });
  const theme = "clsStyle";

  const fetchTerminalData = (force) => {
    /**
     * Fetch all Terminal Data
     */
    fetch(`/update?force=${force}`).then((res) =>
      res.json().then((receivedTerminalData) => {
        setTerminalData((previousstate) => ({
          date: receivedTerminalData.date,
          account: receivedTerminalData.account,
          headers: receivedTerminalData.headers,
          instruments: { ...previousstate.instruments, ...receivedTerminalData.instruments },
          op_headers: receivedTerminalData.op_headers,
          open: receivedTerminalData.open
        })
        )
      })
    );
  };

  const fetchAllPositions = () => {
    /**
     * Fetch all positional Data
     */
    fetch("/get-positions").then((res) =>
      res.json().then((receivedPositions) => {
        setPositionData(receivedPositions);
      })
    );
  };

  const _transmitCommand = (command, data) => {
    /**
     * Send Command to terminal
     */
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      },
      body: JSON.stringify({ 'command': command, data: data })
    };

    fetch('/command', requestOptions)
      .then(response => response.json())
      .then(((receivedSymbolData) => {setSymbolData(receivedSymbolData)}));
  };

  
  const transmitSavePositions = (selected) => {
    selected = "";
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',

      },
      body: JSON.stringify(selected)
    };
    fetch('/save', requestOptions)
      .then(response => response.json())
      .then(((receivedSymbolData) => {

      }));
  };

  const transmitTradeRequest = (request) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',

      },
      body: JSON.stringify(request)
    };
    fetch('/trade', requestOptions)
      .then(response => response.json())
      .then(((idResponse) => {
        if (idResponse.error !== 10009) {

          throw new Error(`Result: [${idResponse.error}] ${idResponse.text} `);
        }
        setErrorData({
          error: idResponse.error,
          text: idResponse.text
        });
      }));
  };

  const commandSelectInstrument = (symbol) => {_transmitCommand('select', symbol)};
  const commandDrawPreview = (ask, bid, sl, tp) => {_transmitCommand('preview', { 'ask': ask, 'bid': bid, 'sl': sl, 'tp': tp })};

  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { fetchTerminalData(false) }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);

  const handlersHistory = { fetchAllPositions, transmitSavePositions};
  const handlersTrader = { transmitTradeRequest, commandDrawPreview};
  const handlersSymbols = {commandSelectInstrument, fetchTerminalData: ()=>{fetchTerminalData(true)}};
  return (

    <div className="App">
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Tabs>
          <TabList>
            <Tab>Trading</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanel>
            <div>
              <div>
                <Header
                  customClass={theme}
                  account={terminalData.account}
                  errorData={errorData}
                  date={terminalData.date}
                  getSymbols={()=>{fetchTerminalData(true)}}
                  />
              </div>
              <div className="clsGlobalContainer">
                <div className="clsSymbolsContainer">
                  <Symbols
                    customClass={theme}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    data={mapTerminalData(terminalData.instruments)}
                    instrument={symbolData.info.name}
                    handlers = {handlersSymbols}
                  />
                </div>
                <div className="clsTraderContainer">
                  <Trader
                    customClass={theme}
                    account={terminalData.account}
                    symbol={symbolData.info}
                    headers={terminalData.op_headers}
                    data={mapTerminalData(terminalData.open)}
                    handlers={handlersTrader}
                    />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <History
              customClass={theme}
              handlers ={handlersHistory}
              headers={positionData.headers}
              data={positionData.positions}
            />
          </TabPanel>
        </Tabs>
      </ThemeProvider>
    </div>
  );
}

export default App;
