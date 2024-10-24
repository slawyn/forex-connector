import React from "react";
import TableRows from "src/elements/TableRows";
import TableHeads from "src/elements/TableHeads";

interface SymbolsProps {
    customClass: string;
    headers: string[];
    data: { id: string, items: any[], change: string }[];
    handlers: { setId: (id: string) => void };
}

const Symbols: React.FC<SymbolsProps> = ({ customClass, headers, data, handlers }) => {
    const [sortConfig, setSortConfig] = React.useState<{ key: number, direction: 'ascending' | 'descending' }>({ key: 0, direction: 'ascending' });

    const requestSort = (sortKey: number) => {
        setSortConfig((prevConfig) => ({
            key: sortKey,
            direction: prevConfig.key === sortKey && prevConfig.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

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

    const handleOnClick = (id: string, items: any[]) => {
        handlers.setId(id);
    };

    return (
        <table className={customClass}>
            <TableHeads
                customClass={`${customClass} css-orange-background`}
                data={headers}
                onHeaderClick={requestSort}
            />
            <TableRows
                customClass={customClass}
                data={sortedData}
                onRowClick={handleOnClick}
            />
        </table>
    );
};

// Symbols.whyDidYouRender = true
export default Symbols;
