import React from "react";

function TableHeads({ customClass, data, onHeaderClick }) {
    return (
        <thead>
            <tr>
                {data.map((header, index) => (
                    <th
                        key={header}
                        title={header}
                        className={customClass}
                        onClick={() => onHeaderClick(index)}>
                        {header}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

export default TableHeads;
