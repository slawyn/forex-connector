import React, { useRef, useState, useEffect, createRef } from "react";
import TextInput from "./TextInput";


/**
 * 
 * @param {table refenrece} table 
 * @param {row reference} row 
 */
function highLightRow(table, row) {
    var rows = table.current.rows;
    for (var i = 0; i < (rows.length); i++) {
        rows[i].style.background = "";
    }
    row.current.style.background = "orange";
}
/**
 * 
 * @param {table reference} table 
 * @param {column to sort by} col 
 * @returns 
 */
const sortRows = (table, col) => {
    var sortRowsDirection = true;
    var column = col;
    var tableRef = table.current;
    return () => {
        sortRowsDirection = !sortRowsDirection;
        var rows, i, x, y, shouldSwitch;
        var switching = true;

        while (switching) {

            switching = false;
            rows = tableRef.rows;

            /* Loop through all table rows (except the
            first, which contains table headers): */
            for (i = 1; i < (rows.length - 1); i++) {
                shouldSwitch = false;

                x = rows[i].getElementsByTagName("TD")[column];
                y = rows[i + 1].getElementsByTagName("TD")[column];

                // If so, mark as a switch and break the loop:
                if (sortRowsDirection) {

                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {

                        shouldSwitch = true;
                        break;
                    }
                } else if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }

            /* If a switch has been marked, make the switch
                and mark that a switch has been done: */
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }
    };
}




const selectInstrument = (table, row, instr) => {
    const instrument = instr;
    const rowRef = row;
    const tableRef = table;
    /* Post instrument here */
    return () => {
        highLightRow(table, row);
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer my-token',

            },
            body: JSON.stringify({ 'Instrument': instrument })
        };
        fetch('/command', requestOptions)
            .then(response => response.json())
            .then(data => { console.log("LOG:Instrument sent") });
    }
}


const TableHeadItem = ({ hparam0, hparam1, item, className }) => {
    return (
        <th title={item} className={className} onClick={sortRows(hparam0, hparam1)}>
            {item}
        </th>
    );
};


class TableRow extends React.Component {
    constructor(props) {
        super(props);
        this.tableRef = props.table;
        this.data = props.data;
        this.rowRef = React.createRef();
    }

    componentDidMount() {
    }

    render() {
        return (
            <tr ref={this.rowRef} onClick={selectInstrument(this.tableRef, this.rowRef, this.data[0])}>
                {this.data.map((item) => {
                    return <td key={item}>{item}</td>;
                })}
            </tr>)
    }
}


class Table extends React.Component {

    constructor(props) {
        super(props);
        this.tableRef = React.createRef();
        this.customClass = props.customClass;
        this.headerData = ["INSTRUMENT", "ATR", "CHANGE", "TIME"];
        this.state = {
            data: { account: [], instruments: [] }
        };
    }

    UpdateComponent() {
        /* Updater */
        // Using fetch to fetch the api from
        // flask server it will be redirected to proxy
        fetch("/update").then((res) =>
            res.json().then((received) => {
                this.setState({
                    data: received
                })
            })
        );
    }

    componentDidMount() {
        //this.UpdateComponent();
        /* Update periodically */
        this.interval = setInterval(() => this.UpdateComponent(), 2000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        var headerCount = -1;
        return (
            <div>
                <table className={this.customClass}>
                    <tbody>
                        <tr>
                            <td className={this.customClass}>Company:{this.state.data.account.company}</td>
                            <td className={this.customClass}>Balance:{this.state.data.account.balance}{this.state.data.account.currency}</td>
                            <td className={this.customClass}>{this.state.data.account.login}</td>
                        </tr>
                        <tr>
                            <td className={this.customClass}>Server:{this.state.data.account.server}</td>
                            <td className={this.customClass}>Profit:{this.state.data.account.profit}</td>
                            <td className={this.customClass}>Leverage:{this.state.data.account.leverage}</td>
                        </tr>

                    </tbody>
                </table>

                <table ref={this.tableRef} className={this.customClass}>
                    <thead>
                        <tr>
                            {this.headerData.map((h) => {
                                headerCount += 1;
                                return <TableHeadItem hparam0={this.tableRef} hparam1={headerCount} key={h} item={h} className={this.customClass} />;
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.data.instruments.map((item) => {
                            return <TableRow key={item.id} table={this.tableRef} data={item.items} />;
                        })}
                    </tbody>
                </table>
            </div >
        );
    }
};


export { Table as default };
