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
import { randomIntFromInterval } from "src/utils"
import Api from "src/Api"


function getFormattedData(timeMilliseconds) {
  return new Date(timeMilliseconds).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

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
      symbolData: { name: "", ask: 0, bid: 0, step: 0, volume_step: 0, point_value: 0, digits: 0 },
      paneState: { symbols: false, orders: false },
      terminalData: { date: "", timeoffset: 0, account: [], instruments: {}, updates: {}, openPositions: {}, closedPositions: {} },
      headers: { terminalHeaders: [], openHeaders: [], closeHeaders: [] },
      errorData: { error: 0, text: "" }
    };

    this.simulation = {
      isEnabled: false,
      timeoffset: 0
    }
    this.intervalRef = null;
    this.traderRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress);
    this.fetchHeaders();
    this.fetchClosedPositions();
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
    this.intervalRef = setInterval(() => { this.fetchTerminalData(false) }, 3000);
  };

  fetchTerminalData = (force) => {
    fetch(`/api/update?force=${force}&start=${this.getCurrentTime()}`).then((response) =>
      response.json().then((receivedTerminalData) => {
        this.setState((prevState) => {
          const instruments = { ...prevState.terminalData.instruments, ...receivedTerminalData.instruments };
          const symbolName = prevState.symbolData.name;
          const terminalData = {
            ...prevState.terminalData, ...receivedTerminalData,
            instruments: instruments,
            updates: Object.keys(receivedTerminalData.instruments),
          }

          /* Update symbolData only if a symbol is selected */
          if (symbolName) {
            const symbolData = {
              ...prevState.symbolData,
              ask: parseFloat(instruments[symbolName][3]),
              bid: parseFloat(instruments[symbolName][4])
            }
            return { terminalData: terminalData, symbolData: symbolData }
          }

          return { terminalData: terminalData };
        });
      })
    );
  };

  fetchSymbolData = (instrument) => {
    if (instrument) {
      fetch(`/api/symbol?instrument=${encodeURIComponent(instrument)}`).then((response) =>
        response.json().then((receivedSymbol) => {
          this.setState((prevState) => {
            const instruments = prevState.terminalData.instruments
            const symbolName = receivedSymbol.name
            return {
              symbolData: {
                ...receivedSymbol,
                ask: parseFloat(instruments[symbolName][3]),
                bid: parseFloat(instruments[symbolName][4])
              }
            }
          });
        })
      );
    }
  };

  fetchHeaders = async () => {
    const result = await new Api().fetchHeaders();
    this.setState({ headers: result });
  };

  fetchClosedPositions = async () => {
    const result = await new Api().fetchHistory();
    this.setState((prevState) => {
      return {
        terminalData: {
          ...prevState.terminalData,
          closedPositions: result
        }
      }
    });
  };

  getCurrentTime() {
    const currentBrokerTime = Date.now() + this.state.terminalData.timeoffset + this.simulation.timeoffset;
    return currentBrokerTime
  }

  render() {
    const { calculatorState, symbolData, paneState, terminalData, headers, errorData } = this.state;

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
                brokerDate={getFormattedData(this.getCurrentTime())}
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
                    headers={headers.terminalHeaders}
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
                    headers={headers.openHeaders}
                    openPositions={terminalData.openPositions}
                    handlers={{ closeOrder: this.handleCloseOrder }}
                  />
                }
              />
              <Trader
                ref={this.traderRef}
                customClass={THEME}
                account={terminalData.account}
                symbol={symbolData}
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
                  enableSimulation: (state) => this.toggleSimulation(state)
                }}
              />
              <Charter
                symbol={symbolData}
                openPositions={terminalData.openPositions}
                closedPositions={terminalData.closedPositions}
                calculator={calculatorState.calculator}
                currentTime={this.getCurrentTime()}
                timeframes={TIMEFRAMES} />
            </TabPanel>
            <TabPanel>
              <History
                customClass={THEME}
                headers={headers.closeHeaders}
              />
            </TabPanel>
            <TabPanel>
              <Backtester
                customClass={THEME}
                instruments={terminalData.instruments}
                timeoffset={terminalData.timeoffset}
              />
            </TabPanel>
          </Tabs>
        </ThemeProvider>
      </main>
    );
  }
}

// App.whyDidYouRender = false
export default App;
