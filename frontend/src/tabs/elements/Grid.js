import React from 'react';

const Grid = ({items}) => {
    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
        gridTemplateRows: 'repeat(2, 1fr)', // 2 rows
        gap: '10px', // space between grid items
    };

    return (
        <div style={gridContainerStyle}>
            {items.map((item) => { return item})}
        </div>
    );
};

export default Grid;