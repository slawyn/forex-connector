import React from "react";
import TableRows from "./TableRows"
import TableHeads from "./TableHeads"


const Symbols = ({customClass, headers, data, handlers}) => {
    const [sortConfig, setSortConfig] = React.useState({ key: 0, direction: 'ascending' });


    function requestSort (sortkey){
        let direction = 'ascending'
        if (sortConfig.key === sortkey && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key: sortkey, direction: direction });
    }

    return (
        <div>
            <table className={customClass}>
                <TableHeads data={headers} className={customClass} sorter={requestSort} />
                <TableRows data={data} sortConfig={sortConfig} className={customClass} selector={handlers.commandSelectInstrument} />
            </table>
        </div >
    );

};


export default Symbols;