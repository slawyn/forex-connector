// Importing modules
import React, { useState, useEffect } from "react";
import "./App.css";
import Table from "./Symbols";
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

  /**
 * Fetch Terminal Data
 */
  const fetchTerminalData = () => {
    fetch("/update").then((res) =>
      res.json().then((receivedTerminalData) => {
        setTerminalData(
          receivedTerminalData
        )
      })
    );
  };


  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { fetchServerData(); fetchTerminalData() }, 1000);

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
            <Table customClass={theme} terminalData={terminalData} instrument={selectedInstrument} selector={selectInstrument} />
          </div>

          {/* Right block*/}
          <div className="clsTraderTable">
            <Trader customClass={theme} terminalData={terminalData} instrument={selectedInstrument} />
          </div>
        </div>
      </header >
    </div >

  );

}

export default App;
