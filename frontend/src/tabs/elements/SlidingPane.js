import React from "react";
function SlidingPane ({customClass, isOpen, child}) {
    const display = isOpen?'flex':'none';
    console.log(customClass)
    return (
        <nav style={{ display:display }} className={customClass}>
                {child}
        </nav>
    );
};


export default SlidingPane;