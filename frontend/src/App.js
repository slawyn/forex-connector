import performance from "./Performance";
import React from "react";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import "./css/App.css";
import Symbols from "./tabs/Symbols";
import Trader from "./tabs/Trader";
import History from "./tabs/History";
import Charter from "./tabs/Charter"
import TopBar from "./tabs/TopBar";
import MiscCheckbox from "./Misc";

import SlidingPane from "react-sliding-pane";
import "react-sliding-pane/dist/react-sliding-pane.css";

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});


function createPostRequest(body) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer my-token',
    },
    body: body
  };
}

function mapTerminalData(data, updates) {
  return Object.entries(data).map(([key, value]) => { return { id: key, items: value, updated: updates.includes(key) } });
}

function setUpdated(data) {
  return Object.keys(data)
}

function mergeArray(array) {
  let merged = {}
  array.forEach((dictionary, index) => {
    merged = mergeDict(merged, dictionary)
  })
  return merged
}

function mergeDict(previous, next) {
  for (let [key, value] of Object.entries(next)) {
    if (key in previous && value instanceof Object) {
      previous[key] = mergeDict(previous[key], value)
    }
    else {
      previous[key] = value
    }
  }
  return previous
}

const debugrates = {}

function Commander() {
  const [state, setState] = React.useState()
}
const timeFramesSpan = { "D1": (3600 * 24 * 35 * 1000), "H1": (3600 * 48 * 1000), "M5": (60 * 5 * 12 * 20 * 1000) };
const timeframes = Object.keys(timeFramesSpan)
const theme = "clsStyle";

const App = () => {
  /**
   * Terminal data is numbers, and symbol data is per symbol
   */
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [ratesData, setRatesData] = React.useState({});
  const [instrumentData, setInstrumentData] = React.useState({ selected: { info:{}}, rates: {} })

  const [selected, setSelected] = React.useState({ id: "", preview: false, calculator: {} });
  const [terminalData, setTerminalData] = React.useState({ date: "", account: [], headers: [], instruments: {}, updates: {}, op_headers: [], open: {} });
  const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });
  const [errorData, setErrorData] = React.useState({ error: 0, text: "" });
  const [paneState, setPaneState] = React.useState(false);



  function fetchTerminalData(force) {
    /**
     * Fetch all Terminal Data
     */
    fetch(`/update?force=${force}`).then((response) =>
      response.json().then((receivedTerminalData) => {
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

  function fetchRates(instrument, timeframe, start, end) {
    /**
     * Fetch rates for instrument
     */
    fetch(`/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${timeframe}`).then((response) =>
      response.json().then((receivedRates) => {
        setRatesData((previousRates) => (
          mergeDict(previousRates, receivedRates)
        ))
      })
    );
  };

  function fetchHistory() {
    /**
     * Fetch all positional Data
     */
    fetch("/history").then((response) =>
      response.json().then((receivedPositions) => {
        setPositionData(receivedPositions);
      })
    );
  };

  function fetchSymbol(instrument) {
    /**
     * Fetch symbol info
     */
    fetch(`/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
      response.json().then((receivedSymbol) => {
        setSymbolData(receivedSymbol);
      })
    );
  };

  function fetchAll(instrument) {
    /**
    * Fetch symbol info and rates
    */
    const base = new Date().getTime()
    const promises = Object.entries(timeFramesSpan).map(async ([key, value]) => {
      let start = Math.floor(base - (value))
      const end = Math.floor(base)

      /* If some rate data has already been fetched previously */
      if (key in ratesData && (instrument in ratesData[key])) {
        const rates = ratesData[key][instrument];
        const keys = Object.keys(rates)
        start = keys[keys.length - 1]
      }
      return fetch(`/rates?instrument=${encodeURIComponent(instrument)}&start=${start}&end=${end}&timeframe=${key}`).then((response) => response.json());
    });

    /* Fetch and merge*/
    Promise.all(promises).then(receivedRatesData => {

      /* Additionally fetch selected instrument */
        fetch(`/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
        response.json().then((receivedSymbolData) => {
          setInstrumentData(previousInstrumentdata => ({
            rates: mergeDict(previousInstrumentdata.rates, mergeArray(receivedRatesData)),
            selected: receivedSymbolData
          }))
        }))

        setRatesData(previousRatesData => (mergeDict(previousRatesData, mergeArray(receivedRatesData))))
    })

    // Promise.all(promises).then(receivedRatesData => {
    //   setInstrumentData(previousInstrumentdata => ({
    //     rates: mergeDict(previousInstrumentdata.rates, mergeArray(receivedRatesData)),
    //     symbol: {}
    //   }
    //   ))
    //   setRatesData(previousRatesData => (mergeDict(previousRatesData, mergeArray(receivedRatesData))))
    // })


    fetchSymbol(instrument)
  };

  function _transmitCommand(command, data) {
    const requestOptions = createPostRequest(JSON.stringify({ 'command': command, data: data }))
    fetch('/command', requestOptions).then(response =>
      response.json()).then(((receivedSymbolData) => { }));
  };

  function transmitSavePositions(selected) {
    const requestOptions = createPostRequest("")
    fetch('/save', requestOptions).then(response =>
      response.json()).then(((receivedSymbolData) => { }));
  };

  function requestTrade(request) {
    const requestOptions = createPostRequest(JSON.stringify(request))
    fetch('/trade', requestOptions).then(response =>
      response.json()).then(((idResponse) => {
        if (idResponse.error !== 10009) {
          throw new Error(`Result: [${idResponse.error}] ${idResponse.text} `);
        }
        setErrorData({
          error: idResponse.error,
          text: idResponse.text
        });
      }));
  };

  function toggleSync(preview) {
    setSelected((previous) => (mergeDict(previous, { preview: preview })))
  }

  function commandPreview(ask, bid, sl, tp) {
    setSelected((previous) => (
      mergeDict(
        previous,
        {
          calculator:
          {
            ask: ask,
            bid: bid,
            sl0: sl[0],
            sl1: sl[1],
            tp0: tp[0],
            tp1: tp[1]
          }
        })
    ));

    if (selected.preview) {
      _transmitCommand('preview', { ask, bid, sl, tp })
    }
  }


  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => {
      fetchTerminalData(false);
    }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);


  return (

    <div className="App">
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Tabs>
          <div className="clsHeaderContainer">
            <TabList className="top-bar-tabs">
              <Tab className="top-bar-tab">Trading</Tab>
              <Tab className="top-bar-tab">History</Tab>
            </TabList>
            <MiscCheckbox customClass={"css-button-checkbox"} text="Sync" handler={toggleSync} />
            <button className={"css-blue-button"} onClick={() => { fetchTerminalData(true) }}>Get Symbols</button>
            <button className={"css-blue-button"} onClick={() => setPaneState(true)}>Open Pane</button>
            <TopBar
              customClass="top-bar"
              company={terminalData.account.company}
              balance={terminalData.account.balance}
              currency={terminalData.account.currency}
              login={terminalData.account.login}
              server={terminalData.account.server}
              profit={terminalData.account.profit}
              leverage={terminalData.account.leverage}
              date={terminalData.date}
              error={errorData.error}
            />
          </div>
          <TabPanel>

            <SlidingPane
              customClass={theme}
              overlayClassName={theme}
              isOpen={paneState}
              title="Hey, it is optional pane title.  I can be React component too."
              subtitle="Optional subtitle."
              onRequestClose={() => { setPaneState(false) }}
            >
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <History
                  customClass={theme}
                  handlers={{ getHistory: fetchHistory, saveHistory: transmitSavePositions }}
                  headers={positionData.headers}
                  data={positionData.positions}
                />
              </ThemeProvider>
            </SlidingPane>
            <div>
              <div className="cls100PContainer">
                <Trader customClass={theme}
                  account={terminalData.account}
                  symbol={symbolData.info}
                  headers={terminalData.op_headers}
                  data={mapTerminalData(terminalData.open, terminalData.updates)}
                  handlers={{ requestTrade: requestTrade, commandPreview }}
                />
              </div>
              <div className="cls100PContainer">
                <div className="cls50PContainer">
                  <Charter
                    customClass={theme}
                    timeframes={timeframes}
                    symbol={symbolData.info}
                    // rates={debugrates}
                    rates={ratesData}
                  />
                </div>
                <div className="cls50PContainer">
                  <Symbols
                    customClass={theme}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    data={mapTerminalData(terminalData.instruments, terminalData.updates)}
                    instrument={symbolData.info.name}
                    handlers={{ setId: fetchAll }}
                  />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <History
              customClass={theme}
              handlers={{ getHistory: fetchHistory, saveHistory: transmitSavePositions }}
              headers={positionData.headers}
              data={positionData.positions}
            />
          </TabPanel>
          {/* </Tabs> */}
        </Tabs>
      </ThemeProvider>
    </div>
  );
}

App.whyDidYouRender = false
export default App;
