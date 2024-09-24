import React from "react";

const TableRows = ({ customClass, data, onRowClick }) => {
    const [selectedId, setSelectedId] = React.useState('');

    const handleRowClick = (id, items) => {
        setSelectedId(id);
        onRowClick(id, items);
    };

    return (
        <tbody>
            {data.map(({ id, items, change }) => {
                const wedgeIdx = items.length - 3;
                const rowBackground = id === selectedId ? 'orange' : '';

                return (
                    <tr
                        key={id}
                        onClick={() => handleRowClick(id, items)}
                        className={customClass}
                        style={{ backgroundColor: rowBackground }}
                    >
                        {items.map((cellData, idx) => {
                            const isWedge = idx >= wedgeIdx;
                            const cellStyle = isWedge
                                ? { color: change === 'positive' ? 'green' : change === 'negative' ? 'red' : '' }
                                : null;

                            return <td key={idx} style={cellStyle}>{cellData}</td>;
                        })}
                    </tr>
                );
            })}
        </tbody>
    );
};

export default TableRows;
