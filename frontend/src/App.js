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
import SlidingPane from "./tabs/elements/SlidingPane";
import MiscCheckbox from "./Misc";


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
  const KEY_OC_TABLE = "t";
  const KEY_GET_SYMBOLS = "s";
  const THEME = "clsBorderless";
  const selected = React.useRef({ instrument: '', calculator: {} });
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", ask: 0, bid: 0, step: 0, volume_step: 0, point_value: 0, digits: 0 } });
  const [paneState, setPaneState] = React.useState(false);
  const [terminalData, setTerminalData] = React.useState({ date: "", account: [], headers: [], instruments: {}, updates: {}, op_headers: [], open: {} });
  const [errorData, setErrorData] = React.useState({ error: 0, text: "" });
  const intervalRef = React.useRef(null);

  const handleKeyPress = (event) => {
    switch (event.key) {
      case KEY_OC_TABLE:
        togglePane();
        break;
      case KEY_GET_SYMBOLS:
        fetchTerminalData(true);
        break;
      default:
        break;
    }
  };

  function togglePane() {
    setPaneState((prevState) => !prevState);
  }

  const startDataFetchInterval = () => {
    intervalRef.current = setInterval(() => {
      fetchTerminalData(false);
      fetchSymbolData(selected.current.instrument);
    }, 3000);
  };

  // Cleanup logic
  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    window.removeEventListener('keydown', handleKeyPress);
  };

  function fetchTerminalData(force) {
    fetch(`/update?force=${force}`).then((response) =>
      response.json().then((receivedTerminalData) => {
        setTerminalData((previousstate) => ({
          date: receivedTerminalData.date,
          account: receivedTerminalData.account,
          headers: receivedTerminalData.headers,
          instruments: { ...previousstate.instruments, ...receivedTerminalData.instruments },
          updates: Object.keys(receivedTerminalData.instruments),
          op_headers: receivedTerminalData.op_headers,
          open: receivedTerminalData.open
        })
        );
      })
    );
  };

  function fetchSymbolData(instrument) {
    if (instrument !== undefined && instrument !== '') {
      fetch(`/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
        response.json().then((receivedSymbol) => {
          setSymbolData(receivedSymbol);
        })
      );
    }
  };

  function setCommand(props) {
    commander.setCommand(props)
    selected.current = { ...selected.current, ...props }
  }
  
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    fetchTerminalData(false);
    startDataFetchInterval();
    return cleanup;

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
            <button className={"css-blue-button"} onClick={() => fetchTerminalData(true)}>Get Symbols[{KEY_GET_SYMBOLS}]</button>
            <button className={"css-blue-button"} onClick={() => togglePane()}>Show Symbols[{KEY_OC_TABLE}]</button>
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
              customClass={"sliding-pane"}
              isOpen={paneState}
              child={<Symbols
                customClass={THEME}
                account={terminalData.account}
                headers={terminalData.headers}
                data={mapTerminalData(terminalData.instruments, terminalData.updates)}
                handlers={{ setId: (id) => { fetchSymbolData(id); setCommand({ instrument: id }) } }}
              />}
            >
            </SlidingPane>
            <Trader customClass={THEME}
              account={terminalData.account}
              symbol={symbolData.info}
              headers={terminalData.op_headers}
              data={mapTerminalData(terminalData.open, terminalData.updates)}
              handlers={{ setErrorData, setCommand: (ask, bid, sl, tp) => { setCommand({ calculator: { ask, bid, sl, tp } }); } }}
            />
            <Charter
              symbol={symbolData.info}
              calculator={selected.current.calculator}
            />
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
