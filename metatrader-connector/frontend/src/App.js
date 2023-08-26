// Importing modules
import React, { useState, useEffect } from "react";
import "./App.css";
import Table from "./Table";



function handleSortColum0() {
  return null;
}

function handleSortColum1() {
  return null;
}

function handleSortColum2() {
  return null;
}

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
        <h1>Trader gui</h1>
        {/* Calling a data from setdata for showing */}
        <p>{data.date}</p>

        <table className="mystyle">
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
                <button type="submit">Buy[Market]</button>
              </td>
              <td>
                <button type="submit" >Buy[Limit]</button>
              </td>
              <td>
                <button type="submit">Buy[Stop]</button>
              </td>
            </tr>
            <tr>
              <td>
                <button type="submit">Sell[Market]</button>
              </td>
              <td>
                <button type="submit">Sell[Limit]</button>
              </td>
              <td>
                <button type="submit">Sell[Stop]</button>
              </td>
            </tr>
            <tr>
              <td>
                <button onClick={handleSortColum0} >Sort byName</button>
              </td>
              <td>
                <button onClick={handleSortColum1} >Sort by Atr</button>
              </td>
              <td>
                <button onClick={handleSortColum2} >Sort by Change</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <Table theadData={theadData1} tbodyData={table} customClass={"mystyle"} />
        </div>
      </header>
    </div >

  );

}

export default App;
