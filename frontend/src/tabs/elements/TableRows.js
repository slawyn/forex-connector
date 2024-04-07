import React from "react";

const TableRows = ({ data, sortConfig, className, setId}) => {
    const [selectedId, setSelectedId] = React.useState('');

    /**
     * Sort Data when possible
     */
    const sortedData = React.useMemo(() => {
        let objs = [...data];
        if (sortConfig != null) {
            objs.sort((a, b) => {
                var _a = a.items[sortConfig.key];
                var _b = b.items[sortConfig.key];

                if (!isNaN(_a)) {
                    _a = parseFloat(_a);
                    _b = parseFloat(_b);
                }

                if (_a < _b) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (_a > _b) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return objs;
    }, [data, sortConfig]);

    return (
        <tbody>
            {
                /** Map instruments to rows */
                sortedData.map((rowData) => {
                    return (
                        <tr
                            key={rowData.id}
                            onClick={() => { setSelectedId(rowData.id); setId(rowData.id);}}
                            className={className}
                            style={{
                                backgroundColor: rowData.id === selectedId ? 'orange' : '',
                                color: rowData.updated === true ? 'red' : ''
                            }} >
                            {
                                /** Map row line */
                                rowData.items.map((cellData) => {
                                    return <td>{cellData}</td>
                                })
                            }
                        </tr>)
                })
            }
        </tbody>
    );
}

export default TableRows;