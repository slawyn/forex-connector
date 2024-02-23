// Importing modules
import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import "./App.css";
import Symbols from "./Symbols";
import Trader from "./Trader";
import History from "./History";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  // usestate for setting a javascript
  // object for storing and using data
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [terminalData, setTerminalData] = React.useState({
    date: "",
    account: [],
    headers: [],
    instruments: {},
    op_headers: [],
    open: {}
  });
  const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });
  const [errorData, setErrorData] = React.useState({ error: 0, text: "" });
  const theme = "clsStyle";


  const mapTerminalData = (data) => {
    return Object.entries(data).map(([key, value]) => { return { id: key, items: value } });
  };


  /**
 * Fetch Terminal Data
 */
  const fetchTerminalData = () => {
    fetch("/update").then((res) =>

      res.json().then((receivedTerminalData) => {

        /* Partial update */
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

  const fetchTerminalDataForce = () => {
    fetch("/update-all").then((res) =>
      res.json().then((receivedTerminalData) => {

        /* Partial update */
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
    fetch("/get-positions").then((res) =>
      res.json().then((receivedPositions) => {
        setPositionData(receivedPositions);
      })
    );
  };

  /**
   * 
   * @param {Trading Symbol} symbol 
   */
  const commandSelectInstrument = (symbol) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',

      },
      body: JSON.stringify({ 'command': 'instrument', 'instrument': symbol })
    };

    fetch('/command', requestOptions)
      .then(response => response.json())
      .then(((receivedSymbolData) => {
        setSymbolData(receivedSymbolData)
      }));
  };

  /**
   * 
   * @param {Stop loss price} sl 
   * @param {Take profit price} tp 
   */
  const commandDrawPreview = (ask, bid, sl, tp) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',

      },
      body: JSON.stringify({ 'command': 'preview', 'preview': { 'ask': ask, 'bid': bid, 'sl': sl, 'tp': tp } })
    };

    fetch('/command', requestOptions)
      .then(response => response.json())
      .then(((receivedSymbolData) => {

      }));
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


  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { fetchTerminalData() }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);

  const handlersHistory = { fetchAllPositions, transmitSavePositions};
  const handlersTrader ={ transmitTradeRequest, commandDrawPreview};
  const handlersSymbols = {commandSelectInstrument, fetchTerminalDataForce};
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
              <table className={theme}>
                <tbody>
                  <tr>
                    <td className={theme}>Company</td>
                    <td className={theme}>Balance</td>
                    <td className={theme}>Login</td>
                    <td className={theme}>Server</td>
                    <td className={theme}>Profit</td>
                    <td className={theme}>Leverage</td>
                    <td className={theme}>Date</td>
                    <td className={theme}>
                      <button className={"clsBluebutton"} onClick={fetchTerminalDataForce}>Get Symbols</button>
                    </td>

                  </tr>
                  <tr>
                    <td className={theme}>{terminalData.account.company}</td>
                    <td className={theme}>{terminalData.account.balance}{terminalData.account.currency}</td>
                    <td className={theme}>{terminalData.account.login}</td>
                    <td className={theme}>{terminalData.account.server}</td>
                    <td className={theme}>{terminalData.account.profit}</td>
                    <td className={theme}>{terminalData.account.leverage}</td>
                    <td className={theme}>{terminalData.date}</td>
                    <td className={theme}>Last Error:{errorData.error}</td>
                  </tr>
                </tbody>
              </table>
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
                  <div className="clsTraderTable">
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
