import performancejo from "./Performance";
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

import { mergeDict } from "./utils";

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



class Commander {
  constructor(){
     this.instrument = ""
     this.selected = false
     this.preview = false
     this.trading = {}
  }

  setCommand(props)
  {
    if(props.preview !== undefined) {
      this.preview = props.preview
    }

    if(props.ask !== undefined && props.bid !== undefined && props.ask !== undefined && props.tp !== undefined) {
      this.trading.ask = props.ask
      this.trading.bid = props.bid
      this.trading.sl = props.sl
      this.trading.tp = props.tp
    }

    if(props.instrument !== undefined) {
      this.instrument = props.instrument
      this.selected = false
    }

    if(this.preview) { 
      if(!this.selected && this.instrument !== "") {
        const requestOptions = createPostRequest(JSON.stringify({ 'command': 'select', data: this.instrument}))
        fetch('/command', requestOptions).then(response =>response.json())
        this.selected = true
      } else if(this.selected && Object.keys(this.trading).length > 0) {
        const requestOptions = createPostRequest(JSON.stringify({ 'command': 'preview', data: this.trading}))
        fetch('/command', requestOptions).then(response =>response.json())
      }
    }
    else{
      this.selected = false
    }
  }
}

const theme = "clsStyle";
const commander = new Commander();

const App = () => {
  /**
   * Terminal data is numbers, and symbol data is per symbol
   */
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [selected, setSelected] = React.useState({ instrument: "", preview: false, calculator: {} });
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
    setSelected({instrument: instrument})
    setCommand({instrument: instrument})

    fetch(`/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
      response.json().then((receivedSymbol) => {
        setSymbolData(receivedSymbol);
      })
    );
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

  function setCommand(props) {
    commander.setCommand(props)
  }

  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => {
      fetchTerminalData(false);
    }, 3000);

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
            <MiscCheckbox customClass={"css-button-checkbox"} text="Sync" handler={(state)=> {setCommand({'preview':state})}} />
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
              title="Title"
              subtitle="Optional subtitle."
              onRequestClose={() => { setPaneState(false) }}
            >
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
              </ThemeProvider>
            </SlidingPane>
            <div>
              <div className="cls100PContainer">
                <Trader customClass={theme}
                  account={terminalData.account}
                  symbol={symbolData.info}
                  headers={terminalData.op_headers}
                  data={mapTerminalData(terminalData.open, terminalData.updates)}
                  handlers={{ requestTrade: requestTrade, setCommand: (ask, bid, sl, tp) => setCommand({ask, bid, sl, tp}) }}
                />
              </div>
              <div className="cls100PContainer">
                <div className="cls50PContainer">
                  <Charter
                    customClass={theme}
                    symbol={symbolData.info}
                    instrument={selected.instrument}
                  />
                </div>
                <div className="cls50PContainer">
                  <Symbols
                    customClass={theme}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    data={mapTerminalData(terminalData.instruments, terminalData.updates)}
                    handlers={{ setId: fetchSymbol }}
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
