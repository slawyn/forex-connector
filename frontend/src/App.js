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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Charter from "./tabs/Charter"

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const mapTerminalData = (data, updates) => {
  return Object.entries(data).map(([key, value]) => { return { id: key, items: value , updated: updates.includes(key)} });
};

const setUpdated = (data) => {
  return Object.keys(data)
}


function App() {
  /**
   * Terminal data is numbers, and symbol data is per symbol
   */
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [ratesData, setRatesData] = React.useState({});
  const [selected, setSelectedId] = React.useState({instrument:"", start:0, end:0});
  const [terminalData, setTerminalData] = React.useState({date: "", account: [], headers: [], instruments: {}, updates: {}, op_headers: [], open: {}});
  
  /**
   * Positional data represents open orders, and error data as status evaluation
   */
  const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });
  const [errorData, setErrorData] = React.useState({ error: 0, text: "" });
  const [preview, setPreview] = React.useState({preview:false});
  const theme = "clsStyle";

  function fetchTerminalData (force) {
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
          updates: setUpdated(receivedTerminalData.instruments),
          op_headers: receivedTerminalData.op_headers,
          open: receivedTerminalData.open
        })
        );
      })
    );
  };

  function fetchRates(instrument, start, end) {
    /**
     * Fetch rates for instrument
     */
    if(instrument !== "" && instrument !== undefined)
    {
      fetch(`/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}`).then((res) =>
      res.json().then((receivedRates) => {
        setRatesData((previousRates) => ({...previousRates, ...receivedRates}))
      })
      );
    }
  };

  function fetchAllPositions() {
    /**
     * Fetch all positional Data
     */
    fetch("/positions").then((res) =>
      res.json().then((receivedPositions) => {
        setPositionData(receivedPositions);
      })
    );
  };

  function _transmitCommand(command, data){
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
      .then(((receivedSymbolData) => { setSymbolData((previousstate) =>({...previousstate,...receivedSymbolData})) }));
  };


  function transmitSavePositions(selected){
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

  function transmitTradeRequest (request) {
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

  function commandSelect(symbolId) {
    const base = new Date().getTime()/1000
    setSelectedId({id:symbolId, start: Math.floor(base - (3600*50)), end:Math.floor(base)})
    _transmitCommand('select', symbolId)
  };

  function getSelectedId() {
    return selected.id
  }

  function handleRates(start, end) {
    fetch(`/rates?start=${start}&end=${end}`).then((res) =>
      res.json().then((receivedPositions) => {
        setPositionData(receivedPositions);
      })
    );
  }


  function commandPreview(ask, bid, sl, tp) { 
    if(preview.preview) { _transmitCommand('preview', { ask, bid,  sl,  tp })};
  }

  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { 
      fetchTerminalData(false);
    }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);


  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { 
      fetchRates(selected.id, selected.start, selected.end);
    }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, [selected]);



  const charterHandlers = {handleRates}
  return (

    <div className="App">
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Tabs>
          <div className="clsHeaderContainer">
            <TabList>
              <Tab>Trading</Tab>
              <Tab>History</Tab>
            </TabList>
            <div>
              <button className={"clsBluebutton"} onClick={() => { fetchTerminalData(true)}}>Get Symbols</button>
            </div>
            <table className={theme}>
              <tbody>
                <tr>
                  <td className={theme}>Company: {terminalData.account.company}</td>
                  <td className={theme}>Balance: {terminalData.account.balance}{terminalData.account.currency}</td>
                  <td className={theme}>Login: {terminalData.account.login}</td>
                  <td className={theme}>Server: {terminalData.account.server}</td>
                  <td className={theme}>Profit: {terminalData.account.profit}</td>
                  <td className={theme}>Leverage: {terminalData.account.leverage}</td>
                  <td className={theme}>Date: {terminalData.date}</td>
                  <td className={theme}>Last Error:{errorData.error}</td>
                  <td>
                     <FormControlLabel control={<Checkbox onChange={(e) => {setPreview(() => ({preview: e.target.checked}))}} />} label="Preview in MT5" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <TabPanel>
            <div>
              <div className="cls100PContainer">
                <Trader customClass={theme}
                  account={terminalData.account}
                  symbol={symbolData.info}
                  headers={terminalData.op_headers}
                  data={mapTerminalData(terminalData.open, terminalData.updates)}
                  handlers={ { transmitTradeRequest, commandPreview }}
                  preview={preview.preview}
                />
              </div>
              <div className="cls100PContainer">
                <div className="cls50PContainer">
                  <Charter customClass={theme} charterdata={ratesData} handlers={charterHandlers}/>
                </div>
                <div className="cls50PContainer">
                  <Symbols customClass={theme}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    data={mapTerminalData(terminalData.instruments, terminalData.updates)}
                    instrument={symbolData.info.name}
                    handlers={{ commandSelect, getSelectedId, fetchTerminalData: () => { fetchTerminalData(true) } }}
                  />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <History customClass={theme}
              handlers={{ fetchAllPositions, transmitSavePositions }}
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
