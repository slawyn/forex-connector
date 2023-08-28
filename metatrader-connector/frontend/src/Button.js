import React, { useRef } from "react";


const Button = ({ name, customClass }) => {
    const buttonRef = useRef(null);
    return (
        <button className={customClass} >{name}</button>
    );
};


export { Button as default };
