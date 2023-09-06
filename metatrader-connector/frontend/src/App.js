// Importing modules
import React, { useState, useEffect } from "react";
import "./App.css";
import Table from "./Symbols";
import Trader from "./Trader";




function App() {
  // usestate for setting a javascript
  // object for storing and using data
  const [data, setData] = useState({
    name: "",
    age: 0,
    date: "",
    programming: "",
  });

  // Using useEffect for single rendering
  React.useEffect(() => {
    fetch("/data").then((res) =>
      res.json().then((data) => {
        setData({
          name: data.Name,
          age: data.Age,
          date: data.Date,
          programming: data.programming,
        });
      })
    );
  }, []);


  return (

    <div className="App">
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
      <header className="App-header">

        {/* Calling a data from setdata for showing */}
        <div>Trader gui {data.date}</div>
        <div className="clsGlobalContainer">

          {/* Left block*/}
          <div className="clsSymbolsContainer">
            <Table customClass={"mystyle"} />
          </div>

          {/* Right block*/}
          <div className="clsTraderTable">
            <Trader customClass={"mystyle"} />
          </div>
        </div>
      </header >
    </div >

  );

}

export default App;
