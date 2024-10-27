import React from "react";
import Table, {mapTerminalData} from "src/elements/table/Table";

interface SymbolsProps {
    customClass: string;
    headers: string[];
    instruments: any[][]
    updates: string[];
    handlers: { setId: (id: string) => void };
}

const Symbols: React.FC<SymbolsProps> = ({ customClass, headers, instruments, updates, handlers }) => {
    const handleOnClick = (id: string, items: any[]) => {
        handlers.setId(id);
    };

    return (
        <Table customClass={customClass}
            customHeaderClass=" css-orange-background"
            headers={headers}
            data={mapTerminalData(instruments, updates)}
            onRowClick={handleOnClick}
        />
    );
};

export default Symbols;
