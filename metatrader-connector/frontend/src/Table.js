import React, { useRef } from "react";


const sort = (ref, col) => {
    var sortDirection = true;
    var column = col;
    var table = ref;
    return () => {
        sortDirection = !sortDirection;
        var rows, i, x, y, shouldSwitch;
        var switching = true;

        while (switching) {

            switching = false;
            rows = table.rows;

            /* Loop through all table rows (except the
            first, which contains table headers): */
            for (i = 1; i < (rows.length - 1); i++) {
                shouldSwitch = false;

                x = rows[i].getElementsByTagName("TD")[column];
                y = rows[i + 1].getElementsByTagName("TD")[column];

                // If so, mark as a switch and break the loop:
                if (sortDirection) {

                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {

                        shouldSwitch = true;
                        break;
                    }
                } else if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }

            /* If a switch has been marked, make the switch
                and mark that a switch has been done: */
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }
    };
}


const TableHeadItem = ({ hparam0, hparam1, item, className }) => {
    return (
        <th title={item} className={className} onClick={sort(hparam0, hparam1)}>
            {item}
        </th>
    );
};


const TableRow = ({ data }) => {
    return (
        <tr>
            {data.map((item) => {
                return <td key={item}>{item}</td>;
            })}
        </tr>
    );
};

const Table = ({ theadData, tbodyData, customClass }) => {
    const tableRef = useRef(null);
    var headerCount = -1;
    return (
        <table ref={tableRef} className={customClass}>
            <thead>
                <tr>
                    {theadData.map((h) => {
                        headerCount += 1;
                        return <TableHeadItem hparam0={tableRef.current} hparam1={headerCount} key={h} item={h} className={customClass} />;
                    })}
                </tr>
            </thead>
            <tbody>
                {tbodyData.map((item) => {
                    return <TableRow key={item.id} data={item.items} />;
                })}
            </tbody>
        </table>
    );
};


export { Table as default };
