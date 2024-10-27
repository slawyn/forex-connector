import React, { Component } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import "src/css/App.css";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Symbols from "src/complex/Symbols";
import Trader from "src/complex/Trader";
import History from "src/complex/History";
import Charter from "src/complex/Charter";
import Backtester from "src/complex/Backtester";
import TopBar from "src/elements/TopBar";
import SlidingPane from "src/elements/SlidingPane";
import MiscCheckbox from "src/elements/Misc";
import Commander from "src/Commander";
import Orders from "src/complex/Orders";
import {randomIntFromInterval} from "src/utils"


const darkTheme = createTheme({ palette: { mode: 'dark' } });
const THEME = "clsBorderless";
const TIMESTAMP_MS_BASE = Date.parse('01/01/2020 00:00:00')
const TIMEFRAMES = ["D1", "H4", "M20"];


class App extends Component {
  constructor(props) {
    super(props);
    this.KEY_OC_SYMBOLS = "s";
    this.KEY_GET_SYMBOLS = "f";
    this.KEY_OC_ORDERS = "o";
    this.commander = new Commander();
    this.state = {
      calculatorState: { instrument: "", calculator: {} },
      symbolData: { info: { name: "", ask: 0, bid: 0, step: 0, volume_step: 0, point_value: 0, digits: 0 } },
      paneState: { symbols: false, orders: false },
      terminalData: { date: "", timeoffset: 0, account: [], headers: [], instruments: {}, updates: {}, op_headers: [], open: {} },
      errorData: { error: 0, text: "" }
    };

    this.simulation = {
      isEnabled:false,
      timeoffset:0
    }
    this.intervalRef = null;
    this.traderRef = React.createRef();
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
    const actions = {
      [this.KEY_OC_SYMBOLS]: () => this.togglePane('symbols'),
      [this.KEY_GET_SYMBOLS]: () => this.fetchTerminalData(true),
      [this.KEY_OC_ORDERS]: () => this.togglePane('orders')
    };
    actions[event.key]?.();
  }

  handleCloseOrder = (...args) => {
    this.traderRef.current?.handleCloseTrade(...args)
  }

  toggleSimulation(state) {
    this.simulation.isEnabled = state
    if (this.simulation.isEnabled) {
      this.simulation.timeoffset = randomIntFromInterval(TIMESTAMP_MS_BASE, Date.now()) - Date.now()
      console.log(this.simulation.timeoffset)
    } else {
      this.simulation.timeoffset = 0
    } 
  }

  togglePane(pane) {
    this.setState((prevState) => ({
      paneState: {
        ...prevState.paneState,
        [pane]: !prevState.paneState[pane]
      }
    }));
  }

  startDataFetchInterval = () => {
    this.intervalRef = setInterval(() => {
      this.fetchTerminalData(false);
      this.fetchSymbolData(this.state.calculatorState.instrument);
    }, 3000);
  };

  fetchTerminalData = (force) => {
    fetch(`/api/update?force=${force}`).then((response) =>
      response.json().then((receivedTerminalData) => {
        this.setState((prevState) => ({
          terminalData: {
            ...prevState.terminalData,
            ...receivedTerminalData,
            instruments: { ...prevState.terminalData.instruments, ...receivedTerminalData.instruments },
            updates: Object.keys(receivedTerminalData.instruments),
          }
        }));
      })
    );
  };

  fetchSymbolData = (instrument) => {
    if (instrument) {
      fetch(`/api/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
        response.json().then((receivedSymbol) => {
          this.setState({ symbolData: receivedSymbol });
        })
      );
    }
  };

  getCurrentTime(){
    const currentBrokerTime = Date.now() + this.state.terminalData.timeoffset + this.simulation.timeoffset;
    return currentBrokerTime
  }

  render() {
    const { calculatorState, symbolData, paneState, terminalData, errorData } = this.state;

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
                  this.commander.setCommand({ preview: state });
                }}
              />
              <MiscCheckbox
                customClass={"css-button-checkbox"}
                text="Sim"
                handler={(state) => { this.toggleSimulation(state) }}
              />
              <button className={"css-blue-button"} onClick={() => this.fetchTerminalData(true)}>
                [{this.KEY_GET_SYMBOLS}]etch Symbols
              </button>
              <button className={"css-blue-button"} onClick={this.toggleSymbolsPane}>
                Show [{this.KEY_OC_SYMBOLS}]ymbols
              </button>
              <button className={"css-blue-button"} onClick={this.toggleOrdersPane}>
                Show [{this.KEY_OC_ORDERS}]rders
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
                customClass={"sliding-pane-left"}
                isOpen={paneState.symbols}
                child={
                  <Symbols
                    customClass={THEME}
                    account={terminalData.account}
                    headers={terminalData.headers}
                    instruments={terminalData.instruments}
                    updates={terminalData.updates}
                    handlers={{
                      setId: (id) => {
                        this.fetchSymbolData(id);
                        this.setState((prevState) => ({
                          calculatorState: {
                            ...prevState.calculatorState,
                            instrument: id
                          },
                        }));
                        this.commander.setCommand({ instrument: id });
                      },
                    }}
                  />
                }
              />
              <SlidingPane
                customClass={"sliding-pane-right"}
                isOpen={paneState.orders}
                child={
                  <Orders
                    customClass={THEME}
                    headers={terminalData.op_headers}
                    open={terminalData.open}
                    handlers={{ closeOrder: this.handleCloseOrder }}
                  />
                }
              />
              <Trader
                ref={this.traderRef}
                customClass={THEME}
                account={terminalData.account}
                symbol={symbolData.info}
                handlers={{
                  setErrorData: (errorData) => this.setState({ errorData }),
                  setCommand: (ask, bid, sl, tp) => {
                    this.setState((prevState) => ({
                      calculatorState: {
                        calculator: { ask, bid, sl, tp }
                      },
                    }));
                    this.commander.setCommand({ calculator: { ask, bid, sl, tp } });
                  },
                }}
              />
              <Charter symbol={symbolData.info} calculator={calculatorState.calculator} currentTime={this.getCurrentTime()} timeframes={TIMEFRAMES}/>
            </TabPanel>
            <TabPanel>
              <History customClass={THEME} />
            </TabPanel>
            <TabPanel>
              <Backtester customClass={THEME} instruments={terminalData.instruments} timeoffset={terminalData.timeoffset} />
            </TabPanel>
          </Tabs>
        </ThemeProvider>
      </main>
    );
  }
}

// App.whyDidYouRender = false
export default App;
