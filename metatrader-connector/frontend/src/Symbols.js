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


const TableHeads = (props) => {
    return (
        <tr key={"HEADERS"}>
            {props.data.map((header, index) => {
                return <th title={header} key={header} className={props.className} onClick={() => { props.sorter(index) }}>
                    {header}
                </th>
            })}
        </tr>
    );
};


const TableRows = (props) => {
    const [selectedId, setHighlight] = useState(-1);

    /**
     * 
     * @param {Selectes Symbol} symbol 
     * @param {Selected Row Id} rowid 
     */
    const selectRow = (symbol, rowid) => {
        setHighlight(rowid);
        selectTerminalSymbol(symbol);
    };

    /**
     * 
     * @param {Selected Symbol} symbol 
     */
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

    /**
     * Sort Data when possible
     */
    const sortedData = React.useMemo(() => {
        let objs = [...props.data];
        if (props.sortConfig != null) {
            objs.sort((a, b) => {
                if (a.items[props.sortConfig.key] < b.items[props.sortConfig.key]) {
                    return props.sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a.items[props.sortConfig.key] > b.items[props.sortConfig.key]) {
                    return props.sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return objs;
    }, [props.data, props.sortConfig]);


    return (
        <>
            {
                /** Map instruments to rows */
                sortedData.map((rowData) => {
                    return <tr key={rowData.id} onClick={() => selectRow(rowData.items[0], rowData.id)} className={props.customClass} style={{

                        backgroundColor: rowData.id === selectedId ? 'orange' : rowData.updated === true ? 'red' : '',
                    }} >
                        {
                            /** Map row line */
                            rowData.items.map((cellData) => {
                                return <td>{cellData}</td>
                            })
                        }

                    </tr>
                })
            }

        </>
    );
}


const Table = (props) => {
    const headerData = ["INSTRUMENT", "SPREAD", "ATR", "RATIO[%]", "CHANGE[%]", "TIME"];

    const [terminalData, setTerminalData] = React.useState({ account: [], instruments: [] });
    const [sortConfig, setSortConfig] = React.useState({ key: 0, direction: 'ascending' });

    /**
     * 
     * @param {Key to Sort by} sortkey 
     */
    const requestSort = (sortkey) => {
        let direction = 'ascending'
        if (sortConfig.key === sortkey && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key: sortkey, direction: direction });
    }

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

    /**
     * Effects
     */
    React.useEffect(() => {
        /* Mount */
        const interval = setInterval(() => fetchTerminalData(), 2000);

        /* Unmount */
        return () => clearInterval(interval);
    }, []);


    return (
        <div>
            <table className={props.customClass}>
                <tbody>
                    <tr>
                        <td className={props.customClass}>Company:{terminalData.account.company}</td>
                        <td className={props.customClass}>Balance:{terminalData.account.balance}{terminalData.account.currency}</td>
                        <td className={props.customClass}>{terminalData.account.login}</td>
                    </tr>
                    <tr>
                        <td className={props.customClass}>Server:{terminalData.account.server}</td>
                        <td className={props.customClass}>Profit:{terminalData.account.profit}</td>
                        <td className={props.customClass}>Leverage:{terminalData.account.leverage}</td>
                    </tr>

                </tbody>
            </table>
            <table className={props.customClass}>
                <thead>
                    {
                        <TableHeads data={headerData} className={props.customClass} sorter={requestSort} />
                    }
                </thead>
                <tbody>
                    {
                        <TableRows data={terminalData.instruments} sortConfig={sortConfig} className={props.customClass} />
                    }
                </tbody>
            </table>
        </div >
    );

};


export { Table as default };
