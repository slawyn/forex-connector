import React from "react";

interface TableHeadsProps {
    customClass: string;
    data: string[];
    onHeaderClick: (index: number) => void;
}

const TableHeads: React.FC<TableHeadsProps> = ({ customClass, data, onHeaderClick }) => {
    return (
        <thead>
            <tr>
                {data.map((header, index) => (
                    <th
                        key={header}
                        title={header}
                        className={customClass}
                        onClick={() => onHeaderClick(index)}
                    >
                        {header}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

export default TableHeads;
