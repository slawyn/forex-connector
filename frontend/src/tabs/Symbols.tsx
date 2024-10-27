import React from "react";
import Table from "src/elements/Table";

interface SymbolsProps {
    customClass: string;
    headers: string[];
    data: { id: string, items: any[], change: string }[];
    handlers: { setId: (id: string) => void };
}

const Symbols: React.FC<SymbolsProps> = ({ customClass, headers, data, handlers }) => {
    const handleOnClick = (id: string, items: any[]) => {
        handlers.setId(id);
    };

    return (
        <Table customClass={customClass}
            customHeaderClass=" css-orange-background"
            headers={headers}
            data={data}
            onRowClick={handleOnClick}
        />
    );
};

export default Symbols;
