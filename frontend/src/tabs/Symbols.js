import React from "react";
import TableRows from "./elements/TableRows"
import TableHeads from "./elements/TableHeads"


const Symbols = ({ customClass, headers, data, handlers }) => {
    const [sortConfig, setSortConfig] = React.useState({ key: 0, direction: 'ascending' });

    function requestSort(sortkey) {
        let direction = 'ascending'
        if (sortConfig.key === sortkey && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key: sortkey, direction: direction });
    }
    return (
        <div>
            <table className={customClass}>
                <TableHeads
                    className={customClass}
                    data={headers}
                    sorter={requestSort} />
                <TableRows
                    className={customClass}
                    data={data}
                    sortConfig={sortConfig}
                    setId={handlers.setId}/>
            </table>
        </div >
    );
};

Symbols.whyDidYouRender = true
export default Symbols;