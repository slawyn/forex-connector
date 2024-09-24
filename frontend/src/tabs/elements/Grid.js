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
            {items.map((item, index) => (
                <div key={index}>{item}</div>
            ))}
        </div>
    );
};

export default Grid;