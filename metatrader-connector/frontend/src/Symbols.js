import React, { useRef, useState, useEffect, createRef } from "react";
import TextInput from "./TextInput";
import Trader from "./Trader";

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
    const selectRow = (symbol) => {
        setSelectedId(symbol);
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

                    return <tr key={rowData.id} onClick={() => selectRow(rowData.id)} className={props.customClass} style={{

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


const Symbols = (props) => {
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
                        <td className={props.customClass}>Company:{props.account.company}</td>
                        <td className={props.customClass}>Balance:{props.account.balance}{props.account.currency}</td>
                        <td className={props.customClass}>{props.account.login}</td>
                    </tr>
                    <tr>
                        <td className={props.customClass}>Server:{props.account.server}</td>
                        <td className={props.customClass}>Profit:{props.account.profit}</td>
                        <td className={props.customClass}>Leverage:{props.account.leverage}</td>
                    </tr>
                </tbody>
            </table>
            <table className={props.customClass}>
                <thead>
                    <TableHeads data={props.headers} className={props.customClass} sorter={requestSort} />
                </thead>
                <tbody>
                    <TableRows data={props.data} sortConfig={sortConfig} className={props.customClass} selector={props.selector} />
                </tbody>
            </table>
        </div >
    );

};


export default Symbols;