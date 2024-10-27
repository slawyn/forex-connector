import React from "react";
import TableHeads from "src/elements/TableHeads";
import TableRows from "src/elements/TableRows";

interface TableProps {
    customClass: string;
    customHeaderClass: string;
    headers: string[];
    data: { id: string, items: any[], change: string }[];
    onRowClick?: (id: string, items: any[]) => void;
    onHeaderClick?: (index: number) => void;
}

const Table: React.FC<TableProps> = ({ customClass, customHeaderClass, headers, data, onRowClick, onHeaderClick }) => {
    const [sortConfig, setSortConfig] = React.useState<{ key: number, direction: 'ascending' | 'descending' }>({ key: 0, direction: 'ascending' });
    const sortedData = React.useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            let valA = a.items[sortConfig.key];
            let valB = b.items[sortConfig.key];
            if (!isNaN(valA)) {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const _onRowClick = (id: string, items: any[]) => {
        if(onRowClick){
            onRowClick(id, items)
        }
    };

    const _onHeaderClick = (index: number) => {
        setSortConfig((prevConfig) => ({
            key: index,
            direction: prevConfig.key === index && prevConfig.direction === 'ascending' ? 'descending' : 'ascending',
        }));

        if(onHeaderClick){
            onHeaderClick(index)
        }
    };


    return (
        <table className={customClass}>
            <TableHeads
                customClass={`${customClass} ${customHeaderClass}`}
                data={headers}
                onHeaderClick={_onHeaderClick}
            />
            <TableRows
                customClass={customClass}
                data={sortedData}
                onRowClick={_onRowClick}
            />
        </table>
    );
}

export default Table;