import React from "react";
import TableRows from "./elements/TableRows"
import TableHeads from "./elements/TableHeads"


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
                <TableRows data={data} sortConfig={sortConfig} className={customClass} setId={handlers.commandSelect} getId={handlers.getSelectedId}/>
            </table>
        </div >
    );

};


export default Symbols;