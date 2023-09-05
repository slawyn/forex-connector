import React, { useRef, useState, useEffect, createRef } from "react";
import TextInput from "./TextInput";


/**
 * 
 * @param {table reference} table 
 * @param {column to sort by} col 
 * @returns 
 */
const sortRows = (table, col) => {
    var sortRowsDirection = true;
    return () => {
        sortRowsDirection = !sortRowsDirection;
        var rows, i, x, y, shouldSwitch;
        var switching = true;

        while (switching) {

            switching = false;
            rows = table.current.rows;

            /* Loop through all table rows (except the
            first, which contains table headers): */
            for (i = 1; i < (rows.length - 1); i++) {
                shouldSwitch = false;

                x = rows[i].getElementsByTagName("TD")[col];
                y = rows[i + 1].getElementsByTagName("TD")[col];

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
const selectTerminalSymbol = (symbol) => {
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
        .then(data => { console.log("LOG:Instrument sent") });
}

const TableHeadItem = (props) => {
    return (
        <th title={props.item} className={props.className} onClick={sortRows(props.hparam0, props.hparam1)}>
            {props.item}
        </th>
    );
};


const TableRows = (props) => {

    const [selectedId, setHighlight] = useState(-1);

    const selectRow = (symbol, rowid) => {
        setHighlight(rowid);
        selectTerminalSymbol(symbol);
    };

    return (
        <>
            {
                /** Map instruments to rows */
                props.data.map((rowData) => {
                    return <tr key={rowData.id} onClick={() => selectRow(rowData.items[0], rowData.id)} className={props.customClass} style={{
                        backgroundColor: rowData.id === selectedId ? 'orange' : '',
                    }} >
                        {
                            /** Map row line */
                            rowData.items.map((cellData) => {
                                return <td key={cellData}>{cellData}</td>
                            })
                        }

                    </tr>
                })
            }

        </>
    );
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
                        {
                            <TableRows data={this.state.data.instruments} className={this.customClass} />
                        }
                    </tbody>
                </table>
            </div >
        );
    }
};


export { Table as default };
