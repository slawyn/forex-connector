import React, { useRef, useState, useEffect, createRef } from "react";
import TextInput from "./TextInput";
import Trader from "./Trader";

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

    const [selectedId, setSelectedId] = React.useState("");
    /**
     * 
     * @param {Selectes Symbol} symbol 
     */
    const selectRow = (symbol, id) => {
        setSelectedId(id);
        props.selector(symbol);
    };



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

    return (
        <div>
            <table className={props.customClass}>
                <tbody>
                    <tr>
                        <td className={props.customClass}>Company:{props.terminalData.account.company}</td>
                        <td className={props.customClass}>Balance:{props.terminalData.account.balance}{props.terminalData.account.currency}</td>
                        <td className={props.customClass}>{props.terminalData.account.login}</td>
                    </tr>
                    <tr>
                        <td className={props.customClass}>Server:{props.terminalData.account.server}</td>
                        <td className={props.customClass}>Profit:{props.terminalData.account.profit}</td>
                        <td className={props.customClass}>Leverage:{props.terminalData.account.leverage}</td>
                    </tr>
                </tbody>
            </table>
            <table className={props.customClass}>
                <thead>
                    {
                        <TableHeads data={props.terminalData.headers} className={props.customClass} sorter={requestSort} />
                    }
                </thead>
                <tbody>
                    {
                        <TableRows data={props.terminalData.instruments} sortConfig={sortConfig} className={props.customClass} selector={props.selector} />
                    }
                </tbody>
            </table>
        </div >
    );

};


export { Table as default };
