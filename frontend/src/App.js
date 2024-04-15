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

import { createPostRequest } from "./utils";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function helperChange(value, updates, key) {
  if (updates.includes(key)) {
    return value[value.length - 1] >= 0 ? 'positive' : 'negative'
  }
  return ''
}

function mapTerminalData(data, updates) {
  return Object.entries(data).map(([key, value]) => { return { id: key, items: value, updated: updates.includes(key), change: helperChange(value, updates, key) } });
}

function setUpdated(data) {
  return Object.keys(data)
}

class Commander {
  constructor() {
    this.instrument = ""
    this.selected = false
    this.preview = false
    this.calculator = {}
  }

  setCommand(props) {
    if (props.preview !== undefined) {
      this.preview = props.preview
    }

    if (props.calculator !== undefined) {
      this.calculator.ask = props.calculator.ask
      this.calculator.bid = props.calculator.bid
      this.calculator.sl = props.calculator.sl
      this.calculator.tp = props.calculator.tp
    }

    if (props.instrument !== undefined) {
      this.instrument = props.instrument
      this.selected = false
    }

    if (this.preview) {
      if (!this.selected && this.instrument !== "") {
        const requestOptions = createPostRequest(JSON.stringify({ 'command': 'select', data: this.instrument }))
        fetch('/command', requestOptions).then(response => response.json())
        this.selected = true
      } else if (this.selected && Object.keys(this.calculator).length > 0) {
        const requestOptions = createPostRequest(JSON.stringify({ 'command': 'preview', data: this.calculator }))
        fetch('/command', requestOptions).then(response => response.json())
      }
    }
    else {
      this.selected = false
    }
  }
}

const commander = new Commander();

const App = () => {
  /**
   * Terminal data is numbers, and symbol data is per symbol
   */
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [selected, setSelected] = React.useState({ instrument: '', calculator: {} });
  const [paneState, setPaneState] = React.useState(false);
  const [terminalData, setTerminalData] = React.useState({ date: "", account: [], headers: [], instruments: {}, updates: {}, op_headers: [], open: {} });
  const [errorData, setErrorData] = React.useState({ error: 0, text: "" });
  const THEME = "clsStyle";

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

  function fetchSymbol(instrument) {
    /**
     * Fetch symbol info
     */
    if(instrument !== undefined && instrument !== '')
    {
      fetch(`/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
      response.json().then((receivedSymbol) => {
        setSymbolData(receivedSymbol);
      })
    );
  }
  };

  function setCommand(props) {
    commander.setCommand(props)
    setSelected((previous)=>({...previous,...props}))
  }

  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => {
      fetchTerminalData(false);

      /* Fetch selected symbol data, periodically */
      fetchSymbol(selected.instrument)
      
    }, 3000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);
  return (
    <main className="App">
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Tabs>
          <nav className="clsHeaderContainer">
            <TabList className="top-bar-tabs">
              <Tab className="top-bar-tab">Trading</Tab>
              <Tab className="top-bar-tab">History</Tab>
            </TabList>
            <MiscCheckbox customClass={"css-button-checkbox"} text="Sync" handler={(state) => { setCommand({ preview: state }) }} />
            <button className={"css-blue-button"} onClick={() => fetchTerminalData(true)}>Get Symbols</button>
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
              error={errorData}
            />
          </nav>
          <TabPanel>
            <SlidingPane
              customClass={THEME}
              overlayClassName={THEME}
              isOpen={paneState}
              title="Title"
              subtitle="Optional subtitle."
              onRequestClose={() => { setPaneState(false) }}
            >
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
              </ThemeProvider>
            </SlidingPane>
            <nav>
              <nav className="cls100PContainer">
                <Trader customClass={THEME}
                  account={terminalData.account}
                  symbol={symbolData.info}
                  headers={terminalData.op_headers}
                  data={mapTerminalData(terminalData.open, terminalData.updates)}
                  handlers={{ setErrorData, setCommand: (ask, bid, sl, tp) => { setCommand({calculator:{ ask, bid, sl, tp }}); } }}
                />
              </nav>
              <nav className="cls100PContainer">
                <nav className="cls50PContainer">
                  <Charter
                    customClass={THEME}
                    symbol={symbolData.info}
                    instrument={selected.instrument}
                    calculator={selected.calculator}
                    
                  />
                </nav>
                <nav className="cls50PContainer">
                  <Symbols
                    customClass={THEME}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    data={mapTerminalData(terminalData.instruments, terminalData.updates)}
                    handlers={{ setId: (id) => {fetchSymbol(id); setCommand({ instrument: id })} }}
                  />
                </nav>
              </nav>
            </nav>
          </TabPanel>
          <TabPanel>
            <History customClass={THEME} />
          </TabPanel>
        </Tabs>
      </ThemeProvider>
    </main>
  );
}

App.whyDidYouRender = false
export default App;
