// Importing modules
import React, { useState, useEffect } from "react";
import "./App.css";
import Table from "./Table";
import Button from "./Button";
import TextInput from "./TextInput";



function App() {
  // usestate for setting a javascript
  // object for storing and using data
  const [data, setdata] = useState({
    name: "",
    age: 0,
    date: "",
    programming: "",
  });

  const [table, settable] = useState([]);
  const [value, onChangeText] = React.useState('Useless Multiline Placeholder');
  // Using useEffect for single rendering
  useEffect(() => {
    // Using fetch to fetch the api from
    // flask server it will be redirected to proxy
    fetch("/data").then((res) =>
      res.json().then((data) => {
        // Setting a data from api
        setdata({
          name: data.Name,
          age: data.Age,
          date: data.Date,
          programming: data.programming,
        });
      })
    );

    fetch("/update").then((res) =>
      res.json().then((data) => {
        settable(data);
      })
    );
  }, []);

  const theadData1 = ["INSTRUMENT", "ATR", "CHANGE", "TIME"];

  return (

    <div className="App">
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
      <header className="App-header">
        {/* Calling a data from setdata for showing */}
        <div>Trader gui {data.date}</div>
        <div className="clsGlobalContainer">
          {/* Left block*/}
          <div className="clsSymbolsContainer">
            <TextInput />
            <Table theadData={theadData1} tbodyData={table} customClass={"mystyle"} />
          </div>
          {/* Right block*/}

          <div className="clsTraderTable">
            <table>
              <tbody>
                <tr>
                  <td>
                    <form>
                      <button type="submit">Save to Google</button>
                    </form>
                  </td>
                  <td>
                    <form action="/update">
                      <button type="submit">Update</button>
                    </form>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Button name={"Buy[Market]"} customClass={"bluebutton"} />
                  </td>
                  <td>
                    <Button name={"Buy[Limit]"} customClass={"bluebutton"} />
                  </td>
                  <td>
                    <Button name={"Buy[Stop]"} customClass={"bluebutton"} />
                  </td>
                </tr>
                <tr>
                  <td>
                    <Button name={"Sell[Market]"} customClass={"redbutton"} />
                  </td>
                  <td>
                    <Button name={"Sell[Limit]"} customClass={"redbutton"} />
                  </td>
                  <td>
                    <Button name={"Sell[Stop]"} customClass={"redbutton"} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </header >
    </div >

  );

}

export default App;
