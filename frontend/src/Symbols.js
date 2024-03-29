import React, { useRef, useState, useEffect, createRef } from "react";
import Trader from "./Trader";

const TableHeads = (props) => {
    return (
        <thead>
            <tr>
                {props.data.map((header, index) => {
                    return <th title={header} key={header} className={props.className} onClick={() => { props.sorter(index) }}>
                        {header}
                    </th>
                })}
            </tr>
        </thead>
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
                var _a = a.items[props.sortConfig.key];
                var _b = b.items[props.sortConfig.key];

                if (!isNaN(_a)) {
                    _a = parseFloat(_a);
                    _b = parseFloat(_b);
                }

                if (_a < _b) {
                    return props.sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (_a > _b) {
                    return props.sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return objs;
    }, [props.data, props.sortConfig]);


    return (
        <tbody>
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
        </tbody>
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
                <TableHeads data={props.headers} className={props.customClass} sorter={requestSort} />
                <TableRows data={props.data} sortConfig={sortConfig} className={props.customClass} selector={props.selector} />
            </table>
        </div >
    );

};


export default Symbols;