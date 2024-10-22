import React from 'react';

const Grid = ({ items, columns = 2, rows = 2, gap = '10px' }) => {
    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`, // Configurable columns
        gridTemplateRows: `repeat(${rows}, 1fr)`, // Configurable rows
        gap: gap, // Configurable gap
    };

    return (
        <div style={gridContainerStyle}>
            {items.map((item, index) => {
                // Check if this is the last row with an uneven count of items
                const isLastItem = index === items.length - 1;
                const isUnevenCount = items.length % columns !== 0;
                
                // If the item is the last in an uneven row, span the remaining columns
                const itemStyle = isLastItem && isUnevenCount ? { gridColumn: `span ${columns}` } : {};

                return (
                    <div key={index} style={itemStyle}>
                        {item}
                    </div>
                );
            })}
        </div>
    );
};
export default Grid;