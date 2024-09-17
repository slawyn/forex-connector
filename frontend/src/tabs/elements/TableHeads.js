import React from "react";
function TableHeads ({data, className, sorter}) {
    return (
        <thead>
            <tr>
                {data.map((header, index) => {
                    return <th title={header}  style={{backgroundColor:'#e6520e'}} key={header} className={className} onClick={() => { sorter(index) }}>
                        {header}
                    </th>
                })}
            </tr>
        </thead>
    );
};


export default TableHeads;