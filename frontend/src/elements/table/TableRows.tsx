import React from "react";

interface TableRowsProps {
    customClass: string;
    data: { id: string; items: any[]; change: string }[];
    onRowClick: (id: string, items: any[]) => void;
}

const TableRows: React.FC<TableRowsProps> = ({ customClass, data, onRowClick }) => {
    const [selectedId, setSelectedId] = React.useState<string>('');

    const handleRowClick = (id: string, items: any[]) => {
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
                                : undefined;

                            return <td key={idx} style={cellStyle}>{cellData}</td>;
                        })}
                    </tr>
                );
            })}
        </tbody>
    );
}

export default TableRows;
