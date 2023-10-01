// Importing modules
import React, { useState, useEffect } from "react";
import "./App.css";
import Symbols from "./Symbols";
import Trader from "./Trader";
import Orders from "./Orders";
import History from "./History";




function App() {
  // usestate for setting a javascript
  // object for storing and using data
  const [symbolData, setSymbolData] = React.useState({ info: { name: "", step: 0, volume_step: 0, point_value: 0 } });
  const [terminalData, setTerminalData] = React.useState({
    date: "",
    account: [],
    headers: [],
    instruments: {},
    op_headers: [],
    open: {}
  });
  const [positionData, setPositionData] = React.useState({ headers: [], positions: [] });
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
  const ttcSelectInstrument = (symbol) => {
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
  const ttcDrawPreview = (ask, bid, sl, tp) => {
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
      .then(((receivedSymbolData) => {

      }));
  };


  React.useEffect(() => {
    /* Mount */
    const interval = setInterval(() => { fetchTerminalData() }, 2000);

    /* Unmount */
    return () => clearInterval(interval);
  }, []);

  return (

    <div className="App">
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
      <header className="App-header">

        {/* Calling a data from setdata for showing */}
        <div>Trader gui {terminalData.date}</div>
        <div className="clsGlobalContainer">

          {/* Left block*/}
          <div className="clsSymbolsContainer">
            <Symbols key={"1"}
              customClass={theme}
              account={terminalData.account}
              headers={terminalData.headers}
              data={mapTerminalData(terminalData.instruments)}
              instrument={symbolData.info.name} selector={ttcSelectInstrument} updateall={fetchTerminalDataForce} />
          </div>

          {/* Right block*/}
          <div className="clsTraderContainer">
            <div className="clsTraderTable">
              <Trader key={"2"}
                customClass={theme}
                account={terminalData.account}
                data={terminalData.instruments}
                symbolData={symbolData.info}
                handletrade={transmitTradeRequest}
                handlepreview={ttcDrawPreview} />
            </div>
            <div className="clsPositionsTable">
              <Orders customClass={theme}
                headers={terminalData.op_headers}
                data={mapTerminalData(terminalData.open)}
              />
            </div>
            <div className="clsPositionsTable">
              <History customClass={theme}
                updateall={fetchAllPositions}
                saveall={transmitSavePositions}
                headers={positionData.headers}
                data={positionData.positions}
              />
            </div>
          </div>
        </div>
      </header >
    </div >

  );

}

export default App;
