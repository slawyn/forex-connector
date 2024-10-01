import React, { Component } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import "./css/App.css";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Symbols from "./tabs/Symbols";
import Trader from "./tabs/Trader";
import History from "./tabs/History";
import Charter from "./tabs/Charter";
import Backtester from "./tabs/Backtester";
import TopBar from "./tabs/TopBar";
import SlidingPane from "./elements/SlidingPane";
import MiscCheckbox from "./Misc";
import Commander from "./Commander";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function helperChange(value, updates, key) {
  if (updates.includes(key)) {
    return value[value.length - 1] >= 0 ? 'positive' : 'negative';
  }
  return '';
}

function mapInstruments(data) {
  return Object.keys(data)
}

function mapTerminalData(data, updates) {
  return Object.entries(data).map(([key, value]) => ({
    id: key,
    items: value,
    updated: updates.includes(key),
    change: helperChange(value, updates, key)
  }));
}

class App extends Component {
  constructor(props) {
    super(props);

    this.KEY_OC_TABLE = "t";
    this.KEY_GET_SYMBOLS = "s";
    this.THEME = "clsBorderless";
    
    this.commander = new Commander();
    this.selected = { instrument: '', calculator: {} };
    
    this.state = {
      symbolData: {
        info: { name: "", ask: 0, bid: 0, step: 0, volume_step: 0, point_value: 0, digits: 0 },
      },
      paneState: false,
      terminalData: {
        date: "",
        timeoffset:0,
        account: [],
        headers: [],
        instruments: {},
        updates: {},
        op_headers: [],
        open: {},
      },
      errorData: { error: 0, text: "" },
    };

    this.intervalRef = null;
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress);
    this.fetchTerminalData(false);
    this.startDataFetchInterval();
  }

  componentWillUnmount() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
    window.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress = (event) => {
    switch (event.key) {
      case this.KEY_OC_TABLE:
        this.togglePane();
        break;
      case this.KEY_GET_SYMBOLS:
        this.fetchTerminalData(true);
        break;
      default:
        break;
    }
  };

  togglePane = () => {
    this.setState((prevState) => ({
      paneState: !prevState.paneState,
    }));
  };

  startDataFetchInterval = () => {
    this.intervalRef = setInterval(() => {
      this.fetchTerminalData(false);
      this.fetchSymbolData(this.selected.instrument);
    }, 3000);
  };

  fetchTerminalData = (force) => {
    fetch(`/update?force=${force}`).then((response) =>
      response.json().then((receivedTerminalData) => {
        this.setState((prevState) => ({
          terminalData: {
            ...prevState.terminalData,
            date: receivedTerminalData.date,
            timeoffset: receivedTerminalData.timeoffset,
            account: receivedTerminalData.account,
            headers: receivedTerminalData.headers,
            instruments: { ...prevState.terminalData.instruments, ...receivedTerminalData.instruments },
            updates: Object.keys(receivedTerminalData.instruments),
            op_headers: receivedTerminalData.op_headers,
            open: receivedTerminalData.open,
          },
        }));
      })
    );
  };

  fetchSymbolData = (instrument) => {
    if (instrument) {
      fetch(`/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
        response.json().then((receivedSymbol) => {
          this.setState({ symbolData: receivedSymbol });
        })
      );
    }
  };

  getTimeOffset() {
    return this.state.terminalData.timeoffset
  } 

  setCommand = (props) => {
    this.commander.setCommand(props);
    this.selected = { ...this.selected, ...props };
  };

  render() {
    const { symbolData, paneState, terminalData, errorData } = this.state;

    return (
      <main className="App">
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Tabs>
            <nav className="clsHeaderContainer">
              <TabList className="top-bar-tabs">
                <Tab className="top-bar-tab">Trading</Tab>
                <Tab className="top-bar-tab">History</Tab>
                <Tab className="top-bar-tab">Backtester</Tab>
              </TabList>
              <MiscCheckbox
                customClass={"css-button-checkbox"}
                text="Sync"
                handler={(state) => {
                  this.setCommand({ preview: state });
                }}
              />
              <button className={"css-blue-button"} onClick={() => this.fetchTerminalData(true)}>
                Get Symbols[{this.KEY_GET_SYMBOLS}]
              </button>
              <button className={"css-blue-button"} onClick={this.togglePane}>
                Show Symbols[{this.KEY_OC_TABLE}]
              </button>
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
                child={
                  <Symbols
                    customClass={this.THEME}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    data={mapTerminalData(terminalData.instruments, terminalData.updates)}
                    handlers={{
                      setId: (id) => {
                        this.fetchSymbolData(id);
                        this.setCommand({ instrument: id });
                      },
                    }}
                  />
                }
              />
              <Trader
                customClass={this.THEME}
                account={terminalData.account}
                symbol={symbolData.info}
                headers={terminalData.op_headers}
                data={mapTerminalData(terminalData.open, terminalData.updates)}
                handlers={{
                  setErrorData: (errorData) => this.setState({ errorData }),
                  setCommand: (ask, bid, sl, tp) => {
                    this.setCommand({ calculator: { ask, bid, sl, tp } });
                  },
                }}
              />
              <Charter symbol={symbolData.info} calculator={this.selected.calculator} timeoffset= {terminalData.timeoffset}  />
            </TabPanel>
            <TabPanel>
              <History customClass={this.THEME} />
            </TabPanel>
            <TabPanel>
              <Backtester customClass={this.THEME} instruments={mapInstruments(terminalData.instruments)} timeoffset= {terminalData.timeoffset} />
            </TabPanel>
          </Tabs>
        </ThemeProvider>
      </main>
    );
  }
}

// App.whyDidYouRender = false
export default App;
