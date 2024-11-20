import React from 'react';
import { useWindowSize } from 'src/elements/Resizable';


const MOBILE_WIDTH = 768;

interface GridProps {
    items: React.ReactNode[];
    columns?: number;
    rows?: number;
    gap?: string;
}

const Grid: React.FC<GridProps> = ({ items, columns = 2, rows = 0, gap = '0px' }) => {
    const [width, height] = useWindowSize();
    const isMobile = width <= MOBILE_WIDTH;

    if (isMobile) {
        columns = 1
        rows = items.length
    } else {
        rows = Math.ceil(items.length / columns)
    }

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
                const itemStyle = isLastItem && isUnevenCount ? { gridColumn: `span ${columns}` } : { width: `${(width / columns)}px`, height: `${(height / rows * 0.86)}px` };
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
