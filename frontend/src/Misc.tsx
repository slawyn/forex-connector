import React, { useState, useRef } from "react";

interface MiscCheckboxProps {
    customClass: string;
    text: string;
    handler?: (newState: boolean) => void;
}

const MiscCheckbox: React.FC<MiscCheckboxProps> = ({ customClass, text, handler }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [isActive, setIsActive] = useState<boolean>(false);

    const onToggle = () => {
        const newState = !isActive;
        if (btnRef.current) {
            if (newState) {
                btnRef.current.classList.add("active");
            } else {
                btnRef.current.classList.remove("active");
            }
        }
        setIsActive(newState);
        if (handler) {
            handler(newState);
        }
    };

    return (
        <button
            ref={btnRef}
            className={`${customClass} ${isActive ? "active" : ""}`}
            onClick={onToggle}
        >
            {text}
        </button>
    );
};

export default MiscCheckbox;
