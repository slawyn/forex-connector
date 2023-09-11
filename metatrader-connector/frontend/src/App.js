// Importing modules
import React, { useState, useEffect } from "react";
import "./App.css";
import Symbols from "./Symbols";
import Trader from "./Trader";




function App() {
  // usestate for setting a javascript
  // object for storing and using data
  const [serverData, setServerData] = useState({ date: "" });
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [terminalData, setTerminalData] = React.useState({ account: [], headers: [], instruments: [] });
  const theme = "clsStyle";

  /**
   * 
   * @param {Trading Symbol} symbol 
   */
  const selectInstrument = (symbol) => {
    setSelectedInstrument(symbol);
    transmitTerminalSymbol(symbol);
  };

  /**
   * Fetch Server Data
   */
  const fetchServerData = () => {
    fetch("/server").then((res) =>
      res.json().then((receivedData) => {
        setServerData({
          date: receivedData.date
        });
      })
    );
  };




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
          account: receivedTerminalData.account,
          headers: receivedTerminalData.headers,
          instruments: { ...previousstate.instruments, ...receivedTerminalData.instruments }
        })
        )
      })
    );
  };


  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { fetchServerData(); fetchTerminalData() }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);



  /**
 * 
 * @param {Selected Symbol} symbol 
 */
  const transmitTerminalSymbol = (symbol) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',

      },
      body: JSON.stringify({ 'Instrument': symbol })
    };
    fetch('/command', requestOptions)
      .then(response => response.json())
      .then(data => { });
  }

  return (

    <div className="App">
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
      <header className="App-header">

        {/* Calling a data from setdata for showing */}
        <div>Trader gui {serverData.date}</div>
        <div className="clsGlobalContainer">

          {/* Left block*/}
          <div className="clsSymbolsContainer">
            <Symbols key={"1"}
              customClass={theme}
              account={terminalData.account}
              headers={terminalData.headers}
              data={mapTerminalData(terminalData.instruments)}
              instrument={selectedInstrument} selector={selectInstrument} />
          </div>

          {/* Right block*/}
          <div className="clsTraderTable">
            <Trader key={"2"}
              customClass={theme}
              account={terminalData.account}
              data={terminalData.instruments}
              instrument={selectedInstrument} />
          </div>
        </div>
      </header >
    </div >

  );

}

export default App;
